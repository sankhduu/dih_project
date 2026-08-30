# ⚖️ e-Māpan 2.0 — National Legal Metrology Digital Verification & Stamping Platform

An end-to-end statutory digital verification, certification, and lifecycle management system built in compliance with the **Legal Metrology Act, 2009** and the **Legal Metrology (General) Rules, 2011**.

Developed for the **Department of Consumer Affairs (DoCA)**, Ministry of Consumer Affairs, Food & Public Distribution, Government of India.

---

## 🌟 Key Architecture & Capabilities

```
                       ┌────────────────────────────────────────────────────────┐
                       │               🌐 Next.js 15 Web Portal                │
                       │   - National Analytics Dashboard (/)                   │
                       │   - Trader & Scale Registration (/apply)               │
                       │   - Central Registry & Scheduling (/admin/traders)    │
                       │   - Public Anti-Counterfeit Verification (/verify/:id) │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                         HTTP / REST APIs
                                                   │
                       ┌───────────────────────────▼────────────────────────────┐
                       │          ⚡ Node.js & Express 5.0 REST API             │
                       │   - Port: 5000 (CORS Enabled)                          │
                       │   - PDF-Lib Schedule IX (Form V) Certificate Generator │
                       │   - Multer Multipart Image Upload Middleware           │
                       │   - Offline Report Auto-Sync Receiver                  │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
       ┌───────────────────────────────────┐               ┌───────────────────────────────────┐
       │   ☁️ Supabase Cloud PostgreSQL    │               │    📱 Flutter Field Inspector     │
       │   - `traders` central dataset     │               │   - GPS Anti-Tamper Geotagging    │
       │   - `inspections` storage bucket  │               │   - Live Camera & Local Storage   │
       │   - Real-time RLS Data Protection │               │   - Offline-First Queue & Sync    │
       └───────────────────────────────────┘               └───────────────────────────────────┘
```

---

## 🚀 Features

1. **🏛️ Multi-Stakeholder Unified Web Portal (`src/app`):**
   - **Trader Online Registration (`/apply`):** Native browser GPS `Auto-Locate`, automatic statutory license format generation (`LMO/2026/XXXXX`), and official acknowledgement cards.
   - **Executive Analytics Dashboard (`/`):** National KPIs (Total Traders, Passed, Pending, Compliance Rate %) and Regional NCR jurisdiction metrics.
   - **Central Registry & Scheduling (`/admin/traders`):** Live full-text search, status filtering, one-click Schedule IX Certificate PDF download, and dynamic officer assignment with instant notifications.
   - **Public Anti-Counterfeit Scanner (`/verify/[id]`):** Consumer & Flying Squad authenticity scanner matching SHA-256 digital certificate fingerprints.

2. **⚡ Express API Server (`server.js`):**
   - `GET /api/traders` — Central directory listing with search, filtering, and pagination.
   - `GET /api/traders/:id` — Single trader details by ID or license number.
   - `POST /api/traders` — Public registration endpoint for new instruments.
   - `PATCH /api/traders/:id` — Real-time officer assignment update.
   - `GET /api/certificate/:license_number` — Server-side statutory **Schedule IX (Form V)** PDF generator with embedded QR code.
   - `POST /api/inspections/:license_number/upload` — Multipart form-data image upload to Supabase Storage.
   - `POST /api/inspections/sync` — Offline inspection queue synchronization receiver.

3. **📱 Flutter Field Inspector App (`lmo_inspector_app`):**
   - **Offline-First Storage:** Local trader caching with `shared_preferences`.
   - **Background Auto-Sync:** Listens to `connectivity_plus` to automatically upload queued offline inspections and photographs the moment connectivity is restored.
   - **On-Site Camera Inspection:** Live camera viewfinder preview box, local photo persistence, and instant retake options.
   - **MPE Calibration Table:** Records Zero Load, 50% Capacity, and 100% Capacity Maximum Permissible Error tolerances and physical lead seal numbers.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express 5.0, `cors`, `dotenv`, `pdf-lib`, `qrcode`, `multer`
- **Database & Storage:** Supabase Cloud (PostgreSQL, Supabase Storage)
- **Mobile:** Flutter 3.41, Dart 3.11, `camera`, `connectivity_plus`, `shared_preferences`, `http`, `path_provider`

---

## ⚙️ Setup & Installation

### 1. Backend & Next.js Web App

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run Express API Server (Port 5000)
node server.js

# Run Next.js Development Server (Port 3000)
npm run dev
```

### 2. Flutter Field Inspector Mobile App

```bash
cd lmo_inspector_app

# Get packages
flutter pub get

# Run static analysis and automated test suite
flutter analyze
flutter test

# Run on connected Android / iOS / Desktop device
flutter run
```

---

## 📜 Statutory Compliance

- **Legal Metrology Act, 2009 (Act No. 1 of 2010)** — Section 24 (Mandatory Verification & Stamping).
- **Legal Metrology (General) Rules, 2011** — Rule 14 & Schedule IX (Form V Certificate of Verification), Form VI (Statutory Deficiency Memo), Rule 27 (Periodicity of Verification).
