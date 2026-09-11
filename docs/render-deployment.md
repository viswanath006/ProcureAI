# ProcureAI — Render.com Production Deployment Guide

This guide provides a comprehensive, step-by-step walkthrough for deploying the entire **ProcureAI** multi-service stack onto [Render.com](https://render.com).

---

## 🏛️ Architecture Overview on Render

ProcureAI consists of 4 interconnected services:

| Component | Render Service Type | Runtime | Root Directory | Build Command | Start Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Database** | PostgreSQL Instance | PostgreSQL 16 | — | — | Managed Instance |
| **2. AI Engine** | Web Service | Python 3.11 | `ai-service` | `pip install -r requirements.txt` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **3. Backend API** | Web Service | Node.js (LTS) | `backend` | `npm install && npm run build` | `npm start` |
| **4. Frontend UI** | Static Site | Node.js (Static) | `frontend` | `npm install && npm run build` | `dist` (Publish Dir) |

---

## 🚀 Approach 1: 1-Click Automated Blueprint Deployment (Recommended)

ProcureAI includes a pre-configured [render.yaml](file:///c:/Users/viswa/Desktop/ProcureAI/render.yaml) Infrastructure-as-Code blueprint file.

### Step 1: Push Code to GitHub / GitLab
Ensure your latest changes including `render.yaml` are pushed to your remote repository:
```bash
git add .
git commit -m "Add Render blueprint and production build fixes"
git push origin main
```

### Step 2: Open Render Blueprints
1. Navigate to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top navigation bar.
3. Select **Blueprint**.

### Step 3: Connect Repository & Apply
1. Select your `ProcureAI` repository.
2. Render will automatically parse `render.yaml` and display the 4 resources to be created:
   - `procureai-db` (PostgreSQL)
   - `procureai-ai-service` (Python Web Service)
   - `procureai-backend` (Node Web Service with automatic pre-deploy database migrations)
   - `procureai-frontend` (Static Site with SPA rewrite rules)
3. Click **Apply**.
4. Render will provision and cross-link all environment variables (`DATABASE_URL`, `AI_SERVICE_URL`, `CORS_ORIGIN`, `VITE_API_URL`, and cryptographic secrets) automatically!

---

## 🛠️ Approach 2: Manual Dashboard Deployment (Step-by-Step)

If you prefer configuring each service manually via the Render UI:

---

### Step 1: Deploy Managed PostgreSQL Database
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Configure:
   - **Name**: `procureai-db`
   - **Database**: `procureai`
   - **User**: `procureai`
   - **Region**: Choose the region closest to your users (e.g., `Oregon (US West)` or `Frankfurt (EU)`).
   - **Plan**: `Free` (or `Starter` for persistent high volume).
3. Click **Create Database**.
4. Once provisioned, copy the **Internal Database URL** (e.g., `postgres://procureai:...@dpg-...-a:5432/procureai`).

---

### Step 2: Deploy Python AI Service
1. Click **New +** → **Web Service**.
2. Connect your `ProcureAI` GitHub repository.
3. Configure settings:
   - **Name**: `procureai-ai-service`
   - **Region**: Same as PostgreSQL (e.g., `Oregon`).
   - **Branch**: `main`
   - **Root Directory**: `ai-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/docs`
4. In **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9`
   - `ENVIRONMENT`: `production`
5. Click **Create Web Service**.
6. Note the generated internal/external URL (e.g., `https://procureai-ai-service.onrender.com`).

---

### Step 3: Deploy Node.js Backend API
1. Click **New +** → **Web Service**.
2. Connect your `ProcureAI` GitHub repository.
3. Configure settings:
   - **Name**: `procureai-backend`
   - **Region**: Same as PostgreSQL (e.g., `Oregon`).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Pre-Deploy Command**: `npm run db:migrate`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/v1/health`
4. In **Environment Variables**, configure:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Paste the Internal Database URL from Step 1)*
   - `AI_SERVICE_URL`: *(Paste the URL from Step 2, e.g., `https://procureai-ai-service.onrender.com`)*
   - `JWT_SECRET`: *(Click 'Generate' or enter a secure string >= 32 characters)*
   - `JWT_REFRESH_SECRET`: *(Click 'Generate' or enter a secure string >= 32 characters)*
   - `SEALED_BID_KEY`: *(Generate 64 hex characters / 32 bytes for AES-256-GCM encryption)*
   - `COOKIE_SECURE`: `true`
   - `CORS_ORIGIN`: `*` *(or update with your frontend URL after Step 4)*
5. Click **Create Web Service**.
6. Note the generated Backend URL (e.g., `https://procureai-backend.onrender.com`).

---

### Step 4: Deploy React Frontend (Static Site)
1. Click **New +** → **Static Site**.
2. Connect your `ProcureAI` GitHub repository.
3. Configure settings:
   - **Name**: `procureai-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Redirects / Rewrites** (in settings tab):
   - Add a rewrite rule for Single Page Application routing:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
5. In **Environment Variables**, add:
   - `VITE_API_URL`: *(Paste your Backend URL from Step 3 + `/api/v1`, e.g. `https://procureai-backend.onrender.com/api/v1`)*
6. Click **Create Static Site**.

---

## 🔒 Post-Deployment Verification & Seeding

### 1. Database Migrations & Default Demo Accounts
When the backend deploys, the `preDeployCommand: npm run db:migrate` automatically runs:
- Schema initialization (tenders, bids, companies, audit logs, hash chain).
- PostgreSQL row lock immutability triggers.
- Default demo credentials:

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Government Officer** | `officer.suresh@finance.gov.in` | `ProcureAI_Dev_2026!` |
| **Bidder (Apex Infra)** | `bidder.apex@gmail.com` | `ProcureAI_Dev_2026!` |
| **Bidder (Bharat Civil)** | `bidder.bharat@gmail.com` | `ProcureAI_Dev_2026!` |
| **Independent Auditor** | `auditor.sharma@cag.gov.in` | `ProcureAI_Dev_2026!` |
| **System Admin** | `admin.sys@procureai.gov.in` | `ProcureAI_Dev_2026!` |

*(Note: On the login screen, clicking the quick-login role chips automatically populates credentials).*

---

### 2. Live Verification Checklist
Once your services show **Live**:
1. **Frontend**: Open the frontend URL (`https://procureai-frontend.onrender.com`).
2. **Login**: Click **Officer** to test authentication & JWT cookies.
3. **Sealed Bids**: As a Bidder, test submitting an AES-256-GCM sealed commercial bid.
4. **AI Evaluation (Phase 7 & 8)**: As Officer, click **Evaluate AI** to trigger the Python FastAPI service.
5. **Phase 10 Human Decision**: Approve recommendation and verify SHA-256 cryptographic lock receipt.
6. **Auditor Vigilance**: Log in as Auditor and verify that the SHA-256 audit ledger displays `✓ AUDIT CHAIN VALID`.
