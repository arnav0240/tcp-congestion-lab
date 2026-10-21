"""
ns-3 Simulation Runner & Environment Detector.
Checks for native ns-3 installation (ns3 / waf), builds run commands,
and falls back gracefully to the high-fidelity Educational Discrete-Event Simulator.
"""
import shutil
import os
import subprocess
import json
from typing import Dict, Any, Optional

class NS3Runner:
    def __init__(self, ns3_dir: Optional[str] = None):
        self.ns3_dir = ns3_dir or os.environ.get("NS3_HOME")
        self.executable = self._find_ns3_executable()
        self.is_installed = self.executable is not None
        self.version_info = self._detect_version() if self.is_installed else None

    def _find_ns3_executable(self) -> Optional[str]:
        # Check PATH for ns3, waf, or ns-3
        for bin_name in ["ns3", "ns3.exe", "waf", "ns-3"]:
            path = shutil.which(bin_name)
            if path:
                return path
                
        # Check explicit directory if provided
        if self.ns3_dir and os.path.isdir(self.ns3_dir):
            for bin_name in ["ns3", "waf"]:
                p = os.path.join(self.ns3_dir, bin_name)
                if os.path.isfile(p) and os.access(p, os.X_OK):
                    return p
        return None

    def _detect_version(self) -> Optional[str]:
        if not self.executable:
            return None
        try:
            res = subprocess.run([self.executable, "--version"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return res.stdout.strip()
        except Exception:
            pass
        return "ns-3 (detected)"

    def get_status(self) -> Dict[str, Any]:
        return {
            "ns3_available": self.is_installed,
            "executable_path": self.executable,
            "version": self.version_info,
            "fallback_active": not self.is_installed,
            "active_mode": "ns3" if self.is_installed else "educational_sim",
            "active_mode_title": "Native NS-3 Simulator" if self.is_installed else "Educational Discrete-Event Engine",
            "message": (
                "Native ns-3 simulator ready."
                if self.is_installed
                else "ns-3 is not installed on this host. Using the bundled deterministic Discrete-Event Simulator with RFC-compliant Reno, NewReno, CUBIC, and BBR models."
            )
        }

# Global runner instance
ns3_runner = NS3Runner()
