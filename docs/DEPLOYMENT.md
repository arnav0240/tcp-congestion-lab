# Deployment Guide: TCP Congestion Control Research Lab

This document outlines how to deploy the full-stack TCP Research Lab (React Frontend + FastAPI Backend) to **Vercel** or other cloud hosting platforms (**Render**, **Railway**).

---

## 1. Deploying to Vercel (Recommended)

Vercel natively supports static Vite builds alongside Python Serverless Functions.

The repository is already pre-configured for Vercel with:
- `vercel.json` (Routes `/api/*` to the Python serverless function and serves the built frontend)
- `api/index.py` (Serverless entrypoint exposing the FastAPI app)
- `requirements.txt` (Python runtime dependencies)
- `frontend/package.json` (React 19 + Vite build configuration)

### Method A: Deploy via GitHub (Easiest)
1. Initialize a Git repository and push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TCP Congestion Control Research Lab"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new) and log in.
3. Import your GitHub repository.
4. Vercel will automatically detect `vercel.json`. Leave the build settings as default.
5. Click **Deploy**.
6. Once deployed, Vercel will provide your live URL (e.g., `https://tcp-congestion-lab.vercel.app`)!

---

### Method B: Deploy via Vercel CLI
If you have a Vercel account, you can deploy directly from your terminal:
```bash
# Run from the project root
npx vercel
```
1. Follow the interactive prompts:
   - `Set up and deploy?` &rarr; `y`
   - `Which scope?` &rarr; Select your account
   - `Link to existing project?` &rarr; `N`
   - `What's your project's name?` &rarr; `tcp-congestion-lab`
   - `In which directory is your code located?` &rarr; `./`
2. For production deployment:
   ```bash
   npx vercel --prod
   ```

---

## 2. Deploying to Render (Alternative Free Cloud Option)

Render is an excellent platform for full-stack applications with long-running Python processes:

1. Push your repository to GitHub.
2. Go to [https://render.com](https://render.com) and create a **Web Service**.
3. Select your repository.
4. Set the following configuration:
   - **Environment:** `Python 3`
   - **Build Command:** `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
   - **Start Command:** `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**.

---

## 3. Local Execution Troubleshooting ("Failed to Fetch")

If the frontend ever displays `Failed to fetch`, it means the backend Python server on port 8000 was stopped (e.g. after a computer reboot or terminal closure).

### Fix in 5 seconds:
Run the one-click startup script:
- **On Windows:**
  ```powershell
  .\scripts\start.ps1
  ```
- **On Linux / macOS:**
  ```bash
  ./scripts/start.sh
  ```

Or manually start both services in separate terminals:
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```
Both services will be active at:
- **Frontend:** `http://localhost:5173/`
- **Backend API:** `http://127.0.0.1:8000/api/docs`
