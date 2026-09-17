# ⚖️ e-Māpan 2.0 — National Legal Metrology Field Verification & Anti-Tamper Stamping Engine

> **Problem Statement SIH26036:** *Development of an Online Verification System for Weighing and Measuring Instruments*  
> **Target Department:** Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution, Government of India.  
> **Relationship to eMaap:** **Last-Mile Field Inspection & Enforcement Engine** designed to interface upstream with the national **eMaap** portal launched in December 2024.

---

## 🌟 Strategic Positioning: How e-Māpan 2.0 Augments eMaap

In December 2024, the Department of Consumer Affairs (DoCA) launched the **National Legal Metrology Portal (eMaap)** developed with NIC. While eMaap excels at macro-level governance — central manufacturer/importer licensing, model approvals, and policy monitoring — **e-Māpan 2.0 bridges the critical last-mile inspector and enforcement gap**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │            🏛️ National Legal Metrology Portal (eMaap / DoCA)            │
 │   - Central Model Approvals, Manufacturer Licensing & Policy Rules     │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ Upstream Sync (OpenAPI / mTLS)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │           ⚡ e-Māpan 2.0 Field Verification & Enforcement Engine       │
 │                                                                        │
 │  📱 Offline-First Mobile Inspection   🔒 Anti-Mock GPS & Geofencing   │
 │  📸 Physical Lead Seal Optical Tag    📜 IT Act 2000 Sec 3A DSC Stamp │
 │  ⚡ Queued Schedule IX PDF Generator  🛡️ Role-Based Access Control      │
 └────────────────────────────────────────────────────────────────────────┘
```

| Dimension | National eMaap Portal | e-Māpan 2.0 (Our Solution) |
| :--- | :--- | :--- |
| **Primary Scope** | Macro-licensing, manufacturer registration, policy | Last-mile field inspection, on-site stamping, enforcement |
| **Connectivity Model** | Online-only web application | **100% Offline-first** with reactive background auto-sync |
| **Physical Stamping (Rule 27)** | Digital record entry | **4-Factor anti-proxy attestation** (Geofence + Camera + Anti-Mock GPS) |
| **Anti-Counterfeit Verification** | Portal database query | **Offline/Online instant QR scan** with SHA-256 / PKI signature |
| **Hardware Enforcement** | Standard web browser | Mobile platform channel security with root/mock-GPS detection |

---

## 🏛️ National Architecture & Regional Pilot Scope

- **National Tier:** Universal Maximum Permissible Error (MPE) calculation tables across all 10 instrument categories conforming to OIML R76 / Legal Metrology (General) Rules, 2011 Schedule VII.
- **State Directorate Tier:** Multi-tenant support across all 28 States and 8 Union Territories with localized fee schedules and inspector jurisdictions.
- **District / Sub-Divisional Tier:** Automated jurisdiction routing based on Indian 6-digit postal PIN codes.
- **Phase-1 Sandboxed Pilot Dataset:** For the SIH demonstration, the platform includes a calibrated, privacy-compliant **synthetic dataset covering the Haryana & Delhi NCR corridor** (Hisar, Rohtak, South Delhi, Gurugram) across 1,000 commercial establishments. *(Note: Synthetic data ensures strict compliance with the Digital Personal Data Protection Act, 2023 by preventing commercial disclosure).*

---

## 🌟 Core Modules & Technical Capabilities

```
                       ┌────────────────────────────────────────────────────────┐
                       │               🌐 Next.js 15 Web Portal                │
                       │   - National Analytics Dashboard (/)                   │
                       │   - Trader & Scale Registration (/apply)               │
                       │   - Central Registry & RBAC Scheduling (/admin/traders)│
                       │   - Public Anti-Counterfeit Verification (/verify/:id) │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                     Secure REST APIs (JWT / RBAC)
                                                   │
                       ┌───────────────────────────▼────────────────────────────┐
                       │          ⚡ Node.js & Express 5.0 REST API             │
                       │   - Strict CORS Whitelist & Sliding-Window Rate Limit  │
                       │   - Async Schedule IX (Form V) PDF Generation Queue    │
                       │   - IT Act 2000 Section 3A Digital Signature Block     │
                       │   - Idempotent Offline Sync Handshake Engine           │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
       ┌───────────────────────────────────┐               ┌───────────────────────────────────┐
       │     ☁️ Database & Sovereign Cloud │               │    📱 Flutter Field Inspector     │
       │   - PostgreSQL with RLS Policies  │               │   - Mock GPS & Root Detection     │
       │   - S3-Compatible Object Storage  │               │   - Hardware Geofence Verification│
       │   - Cloud-Agnostic / NIC MeghRaaj │               │   - Mandatory Camera Lead Seal Tag│
       │   - DPDP Act 2023 Data Residency  │               │   - Offline Queue & Auto-Sync     │
       └───────────────────────────────────┘               └───────────────────────────────────┘
```

### 1. Unified Web Portal (`src/app`)
- **Trader Self-Registration (`/apply`):** Direct applicant workflow with statutory license format generation (`HR-LMO-HIS-2026-XXXXX`).
- **Executive National Dashboard (`/`):** National KPIs (Total Registered, Verified, Pending, Compliance Rate %), district breakdowns, and interactive **eMaap Interoperability & Strategic Roadmap Banner** (DigiLocker, anti-corruption analytics, APMC mandi fallback).
- **Protected Central Registry (`/admin/traders`):** Protected by Next.js edge middleware and backend Bearer JWT authentication. Displays **Statutory Risk Index (SRI 0–100) badges** (`CRITICAL`, `MODERATE`, `LOW`), citizen complaint counts, sort-by-risk toggles, and one-click **"⚡ Auto-Assign by Risk"**.
- **Public Anti-Counterfeit Scanner & Grievance Portal (`/verify/[id]`):** Consumer & flying squad verification page validating the cryptographic SHA-256 certificate digest, **"Physical Lead Seal Authenticity & Tamper Check"**, and **"Report this Scale / Lodge Grievance"** under Rule 27.

### 2. Scalable Express API Server (`server.js`)
- `GET /api/traders` — Directory listing with district/status filtering, `?sortBy=risk` prioritization, rate-limited and protected.
- `GET /api/traders/:id` — Single trader details by ID or license number with enriched SRI risk scores and seal hashes.
- `POST /api/traders` — Public registration endpoint for new instruments.
- `POST /api/traders/auto-assign-risk` — **Predictive Risk Auto-Assignment** routing high-risk traders to available district LMO officers.
- `POST /api/complaints` & `GET /api/complaints/:license_number` — **Rule 27 Citizen Grievance Engine** logging complaints and dynamically elevating establishment risk.
- `POST /api/certificate/:license_number/verify-seal` — **Two-Way Cryptographic Seal Verifier** comparing physical lead seal numbers against statutory hashes.
- `PATCH /api/traders/:id` — **RBAC-protected** officer assignment and inspection status transition.
- `GET /api/certificate/:license_number` — **Asynchronous queued Schedule IX PDF generator** with in-memory caching and embedded IT Act 2000 Section 3A digital signature block.
- `POST /api/inspections/sync` — **Idempotent offline sync receiver** with conflict detection.
- `POST /api/inspections/:license_number/upload` — Multipart inspection photograph handler.

### 3. Flutter Field Inspector Mobile App (`lmo_inspector_app`)
- **Real-Time OIML R76 MPE Calculation Engine (`MpeCalculatorService`):** Computes statutory Maximum Permissible Error step functions ($m \le 500e \to \pm 0.5e$, $500e < m \le 2000e \to \pm 1.0e$, $m > 2000e \to \pm 1.5e$) and doubles in-service reverification tolerances under Rule 14(4). Automatically locks status to 'Failed' on breach.
- **Statutory Risk Index (SRI) Badges & Alerts:** Prominently renders trader risk tiers and displays citizen complaint warnings on inspection sheets.
- **Anti-Mock GPS Engine (`GeoVerificationService`):** Inspects `position.isMocked` to detect spoofed coordinates or emulator location tampering.
- **Rule 27 Geofencing:** Verifies inspector is physically within 150 meters of registered premises.
- **Rule 14 Optical Seal Tagging:** Mandatory live camera viewfinder capture of the crimped lead/wire seal; gallery picking disabled for statutory submissions.
- **Graceful Failure UI:** Clear statutory modals when camera/GPS permissions are denied, with one-tap deep links to system settings.
- **Offline-First Synchronization:** Local persistent caching with `SharedPreferences`, listening to `connectivity_plus` to auto-push queued inspections with unique idempotency keys.

---

## 📜 Statutory Compliance & Legal Validity

| Statute / Regulation | Statutory Provision | Implementation in e-Māpan 2.0 |
| :--- | :--- | :--- |
| **Legal Metrology Act, 2009** | **Section 24** (Mandatory Verification) | Complete inspection checklist and stamping workflow |
| **Legal Metrology Act, 2009** | **Section 30** (Offenses & Penalties) | Consumer anti-counterfeit QR code verification |
| **Legal Metrology (General) Rules, 2011** | **Rule 14 & Schedule IX (Form V)** | Automated Certificate of Verification PDF generation |
| **Legal Metrology (General) Rules, 2011** | **Form VI** | Statutory Deficiency & Rejection Memo generation |
| **Legal Metrology (General) Rules, 2011** | **Rule 27** (Periodicity & Stamping) | 4-Factor physical presence attestation & lead seal tracking |
| **Legal Metrology (General) Rules, 2011** | **Schedule VII** (MPE Limits) | Automated calibration tolerance verification engine |
| **Information Technology Act, 2000** | **Section 3 & 3A** (Digital Signatures) | SHA-256 canonical digest + CCA-compliant DSC / eSign block |
| **DPDP Act, 2023 & MeitY Cloud Policy** | **Data Sovereignty & Residency** | 100% cloud-agnostic architecture deployable to **NIC MeghRaaj** |

---

## 🔒 Security Architecture & Hardening

1. **Authentication & Authorization (RBAC):**
   - Public users can only register instruments (`POST /api/traders`) and verify certificates (`GET /api/certificate/:lic`, `/verify/:id`).
   - Administrative and officer actions require `Authorization: Bearer <token>` or `x-api-key`.
   - Next.js middleware guards `/admin/*` and redirects unauthenticated visitors to `/login`.
2. **Strict CORS Whitelist:**
   - Wildcard `*` disabled. Allowed origins strictly limited to configured frontend domains and authenticated mobile clients.
3. **Event Loop Safeguards & PDF Concurrency:**
   - PDF generation bounded by an in-memory concurrency queue (max 5 simultaneous builds).
   - In-memory SHA-256 document cache delivers repeat certificate requests in `<4ms` with HTTP 304 / ETag support.
4. **Idempotent Sync & Optimistic Locking:**
   - Offline reports carry unique `idempotency_key` headers. Duplicate sync attempts return `200 OK` with existing status without double-writing.
   - Conflicts trigger `409 Conflict` and route to the District Controller queue.

---

## ☁️ Cloud Sovereignty & MeghRaaj Deployment

e-Māpan 2.0 is **100% cloud-agnostic**:

```
           ┌───────────────────────────────────────────────┐
           │      MeitY / NIC MeghRaaj (GI Cloud)         │
           │        National Data Centre (NDC)             │
           │                                               │
           │  ┌─────────────────┐   ┌───────────────────┐  │
           │  │ PostgreSQL 16   │   │ MinIO Object      │  │
           │  │ with RLS        │   │ Storage (S3 API)  │  │
           │  └────────┬────────┘   └─────────┬─────────┘  │
           │           └──────────┬───────────┘            │
           │                      ▼                        │
           │        Docker / Kubernetes Pods               │
           │   - Next.js 15 Web Portal                     │
           │   - Node.js Express REST API Cluster          │
           └───────────────────────────────────────────────┘
```

- **Zero Foreign Cloud Dependence:** Built with standard PostgreSQL and S3-compatible APIs.
- **Production Target:** Seamlessly drops into **NIC MeghRaaj (GI Cloud)** using self-hosted PostgreSQL and MinIO on Government of India servers.
- **Compliance:** Satisfies all requirements of the **Digital Personal Data Protection (DPDP) Act, 2023** and MeitY Sovereign Cloud guidelines.

---

## 🛠️ Quick Start & Setup

### 1. Backend & Next.js Web Portal

```bash
# Install root dependencies
npm install

# Run backend automated security and compliance test suites
node test/security-and-scale.test.js
node test-compliance.mjs

# Start Express API Server (Port 5000)
npm run server

# In another terminal, start Next.js Web App (Port 3000)
npm run dev
```

### 2. Flutter Field Inspector Mobile App

```bash
cd lmo_inspector_app

# Fetch dependencies
flutter pub get

# Run static analysis and automated unit test suite
flutter analyze
flutter test

# Run on connected Android / iOS / Desktop device
flutter run
```

---

## 🛡️ Quick Jury Defense Guide

For comprehensive rapid-fire answers to the top 14 questions asked by DoCA and technical evaluators, refer to:  
👉 **[DEFENSE_AND_BATTLE_CARD.md](DEFENSE_AND_BATTLE_CARD.md)**
