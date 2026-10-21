/*
 * ns-3 Simulation Script for TCP Congestion Control Research Lab
 * File: tcp_congestion_lab.cc
 *
 * Implements a Point-to-Point bottleneck topology:
 *   Sender Node(s) [n0] ---> Router 1 [r1] ===== (Bottleneck Link) =====> Router 2 [r2] ---> Receiver Node [n1]
 *
 * Supports native ns-3 TCP models:
 *   - ns3::TcpLinuxReno / ns3::TcpNewReno
 *   - ns3::TcpCubic
 *   - ns3::TcpBbr
 *
 * Configurable arguments:
 *   --bandwidth=50Mbps
 *   --delay=20ms
 *   --lossRate=0.01
 *   --queueLimit=50
 *   --duration=15.0
 *   --tcpTypeId=TcpCubic (or TcpNewReno, TcpBbr, TcpLinuxReno)
 *   --outputJson=results.json
 */

#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <iomanip>

#include "ns3/core-module.h"
#include "ns3/network-module.h"
#include "ns3/internet-module.h"
#include "ns3/point-to-point-module.h"
#include "ns3/applications-module.h"
#include "ns3/traffic-control-module.h"
#include "ns3/flow-monitor-module.h"

using namespace ns3;

NS_LOG_COMPONENT_DEFINE("TcpCongestionLab");

// Telemetry recording structure
struct TimeSeriesSample {
    double time;
    double throughputMbps;
    double cwndPackets;
    double rttMs;
    uint32_t queuePackets;
    uint32_t drops;
};

std::vector<TimeSeriesSample> g_timeSeries;
uint32_t g_totalDrops = 0;
double g_currentCwnd = 0;
double g_currentRtt = 0;
uint32_t g_currentQueueSize = 0;
uint64_t g_bytesReceived = 0;
uint64_t g_lastBytesReceived = 0;

static void CwndTracer(uint32_t oldval, uint32_t newval) {
    g_currentCwnd = newval / 1460.0; // convert bytes to MSS packets
}

static void RttTracer(Time oldval, Time newval) {
    g_currentRtt = newval.GetMilliSeconds();
}

static void QueueDropTracer(Ptr<const Packet> p) {
    g_totalDrops++;
}

static void RxPacketTracer(Ptr<const Packet> p, const Address &addr) {
    g_bytesReceived += p->GetSize();
}

static void PeriodicTelemetrySample(double intervalSec) {
    double now = Simulator::Now().GetSeconds();
    uint64_t diffBytes = g_bytesReceived - g_lastBytesReceived;
    g_lastBytesReceived = g_bytesReceived;
    double throughputMbps = (diffBytes * 8.0) / (intervalSec * 1e6);

    TimeSeriesSample sample;
    sample.time = now;
    sample.throughputMbps = throughputMbps;
    sample.cwndPackets = g_currentCwnd;
    sample.rttMs = g_currentRtt;
    sample.queuePackets = g_currentQueueSize;
    sample.drops = g_totalDrops;
    g_timeSeries.push_back(sample);

    Simulator::Schedule(Seconds(intervalSec), &PeriodicTelemetrySample, intervalSec);
}

int main(int argc, char *argv[]) {
    std::string tcpTypeId = "TcpCubic";
    std::string bandwidth = "50Mbps";
    std::string delay = "20ms";
    double lossRate = 0.0;
    uint32_t queueLimit = 50;
    double duration = 15.0;
    std::string outputJson = "ns3_result.json";

    CommandLine cmd(__FILE__);
    cmd.AddValue("tcpTypeId", "TCP variant: TcpNewReno, TcpCubic, TcpBbr, TcpLinuxReno", tcpTypeId);
    cmd.AddValue("bandwidth", "Bottleneck bandwidth (e.g. 50Mbps)", bandwidth);
    cmd.AddValue("delay", "Bottleneck propagation delay (e.g. 20ms)", delay);
    cmd.AddValue("lossRate", "Independent random packet drop rate (0.0 - 0.1)", lossRate);
    cmd.AddValue("queueLimit", "Max router queue packets", queueLimit);
    cmd.AddValue("duration", "Simulation duration in seconds", duration);
    cmd.AddValue("outputJson", "Output JSON filepath", outputJson);
    cmd.Parse(argc, argv);

    // Set TCP Congestion Control Algorithm
    Config::SetDefault("ns3::TcpL4Protocol::SocketType", StringValue("ns3::" + tcpTypeId));
    Config::SetDefault("ns3::TcpSocket::SegmentSize", UintegerValue(1460));

    // Create Topology Nodes: S (Sender) -> R1 (Router 1) -> R2 (Router 2) -> D (Destination)
    NodeContainer nodes;
    nodes.Create(4);
    Ptr<Node> sender = nodes.Get(0);
    Ptr<Node> r1 = nodes.Get(1);
    Ptr<Node> r2 = nodes.Get(2);
    Ptr<Node> receiver = nodes.Get(3);

    // Access Link: Sender -> R1 (1Gbps, 1ms delay)
    PointToPointHelper accessLink;
    accessLink.SetDeviceAttribute("DataRate", StringValue("1Gbps"));
    accessLink.SetChannelAttribute("Delay", StringValue("1ms"));
    NetDeviceContainer devSenderR1 = accessLink.Install(sender, r1);

    // Bottleneck Link: R1 -> R2 (Configurable Bandwidth and Delay)
    PointToPointHelper bottleneckLink;
    bottleneckLink.SetDeviceAttribute("DataRate", StringValue(bandwidth));
    bottleneckLink.SetChannelAttribute("Delay", StringValue(delay));
    bottleneckLink.SetQueue("ns3::DropTailQueue<Packet>", "MaxSize", QueueSizeValue(QueueSize(QueueSizeUnit::PACKETS, queueLimit)));
    NetDeviceContainer devR1R2 = bottleneckLink.Install(r1, r2);

    // Destination Access Link: R2 -> Receiver (1Gbps, 1ms)
    NetDeviceContainer devR2Receiver = accessLink.Install(r2, receiver);

    // Install optional random packet loss error model on bottleneck link
    if (lossRate > 0.0) {
        Ptr<RateErrorModel> em = CreateObject<RateErrorModel>();
        em->SetAttribute("ErrorRate", DoubleValue(lossRate));
        em->SetAttribute("ErrorUnit", StringValue("ERROR_UNIT_PACKET"));
        devR1R2.Get(1)->SetAttribute("ReceiveErrorModel", PointerValue(em));
    }

    // Install Internet Stack
    InternetStackHelper internet;
    internet.Install(nodes);

    // Assign IP Addresses
    Ipv4AddressHelper ipv4;
    ipv4.SetBase("10.1.1.0", "255.255.255.0");
    Ipv4InterfaceContainer ifSenderR1 = ipv4.Assign(devSenderR1);

    ipv4.SetBase("10.1.2.0", "255.255.255.0");
    Ipv4InterfaceContainer ifR1R2 = ipv4.Assign(devR1R2);

    ipv4.SetBase("10.1.3.0", "255.255.255.0");
    Ipv4InterfaceContainer ifR2Receiver = ipv4.Assign(devR2Receiver);

    Ipv4GlobalRoutingHelper::PopulateRoutingTables();

    // Install Packet Sink Application on Receiver Node (Port 8080)
    uint16_t sinkPort = 8080;
    Address sinkAddress(InetSocketAddress(ifR2Receiver.GetAddress(1), sinkPort));
    PacketSinkHelper packetSinkHelper("ns3::TcpSocketFactory", InetSocketAddress(Ipv4Address::GetAny(), sinkPort));
    ApplicationContainer sinkApps = packetSinkHelper.Install(receiver);
    sinkApps.Start(Seconds(0.0));
    sinkApps.Stop(Seconds(duration));

    // Install BulkSend Application on Sender Node
    BulkSendHelper source("ns3::TcpSocketFactory", sinkAddress);
    source.SetAttribute("MaxBytes", UintegerValue(0)); // 0 = send continuously
    ApplicationContainer sourceApps = source.Install(sender);
    sourceApps.Start(Seconds(0.5));
    sourceApps.Stop(Seconds(duration));

    // Schedule Telemetry Sampling every 100ms
    Simulator::Schedule(Seconds(0.1), &PeriodicTelemetrySample, 0.1);

    // Run Simulation
    Simulator::Stop(Seconds(duration));
    Simulator::Run();

    // Export Telemetry and Aggregated Results to JSON
    std::ofstream out(outputJson);
    out << "{\n";
    out << "  \"execution_mode\": \"ns3\",\n";
    out << "  \"simulator_name\": \"ns-3 Discrete-Event Network Simulator\",\n";
    out << "  \"tcp_variant\": \"" << tcpTypeId << "\",\n";
    out << "  \"duration_sec\": " << duration << ",\n";
    out << "  \"total_bytes_received\": " << g_bytesReceived << ",\n";
    out << "  \"total_drops\": " << g_totalDrops << ",\n";
    out << "  \"time_series_count\": " << g_timeSeries.size() << "\n";
    out << "}\n";
    out.close();

    std::cout << "ns-3 simulation finished successfully. Output written to: " << outputJson << std::endl;

    Simulator::Destroy();
    return 0;
}
