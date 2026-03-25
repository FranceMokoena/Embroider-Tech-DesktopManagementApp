# ALPHA - EmbroideryTech Desktop Management System (Full System Notes)

This file is the single source of truth for how the system is wired, what talks to what, and how to debug the most common (and painful) failures. It is intentionally direct and short so a new developer can get productive fast.

---

## 1) What This System Is

EmbroideryTech Desktop Management System is a React + Electron admin dashboard that shows data from the **mobile backend**. The desktop app **does not own the primary data**; it reads and sometimes writes data through the mobile API.

High-level flow:
```
Mobile App -> Mobile Backend (MongoDB) -> Desktop Backend -> Desktop Frontend (React/Electron)
```

The desktop backend is the bridge. It calls the mobile API, does light enrichment, then serves the admin dashboard UI.

---

## 2) Repo Map (What Lives Where)

- `src/` (Frontend React UI)
  - Pages (Dashboard, Sessions, Notifications, etc.)
  - `layout/AppShell.jsx` (top header, notification bell, theme toggle)
  - `services/apiClient.js` (frontend API calls to desktop backend)

- `desktop-backend/` (Node/Express API)
  - `src/server.js` (main server entry)
  - `src/routes/*.js` (REST routes)
  - `src/controllers/*.js` (core logic)
  - `src/services/mobileApiService.js` (talks to mobile backend)
  - `src/services/databaseService.js` (MongoDB connection)
  - `scripts/` (admin utilities and reports)

- `assets/`, `build/`, `dist/` (static resources + builds)

---

## 3) Local Development (Known Working Ports)

- Desktop Frontend (React): http://localhost:3000
- Desktop Backend (Express): http://localhost:5001
- Mobile Backend (Express): http://localhost:5002 (or Render URL in prod)

Commands:
- Root UI: `npm start`
- Desktop backend: `cd desktop-backend && npm run dev`
- Full Electron dev: `npm run dev` (root)

---

## 4) Authentication and Tokens (CRITICAL)

There are **two token flows**:

### A) Desktop Admin Login (for UI access)
- `desktop-backend/src/middleware/auth.js` uses **in-memory admin users** from env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`).
- Login: `POST /api/auth/login` returns `adminToken` stored in `localStorage.adminToken`.
- This is used by `apiClient.js` for admin endpoints.

### B) Mobile API Token (for data access)
- The desktop backend calls the mobile backend using a **shared JWT**.
- The mobile backend expects **both headers**:
  - `Authorization: Bearer <JWT>`
  - `mobile-token: <same JWT>`
- Token is from `MOBILE_ADMIN_TOKEN` (or fallback `MOBILE_API_KEY`).

**If mobile data does not load**, the FIRST thing to check is the shared JWT and header format.

---

## 5) Desktop Backend (What It Does)

Entry: `desktop-backend/src/server.js`
- Express with CORS, Helmet, compression, rate limits
- Routes mounted:
  - `/api/auth` (login, register, profile, mobile-token)
  - `/api/admin` (dashboard data, users, sessions, scans)
  - `/api/reports` (CSV/Excel/PDF)
  - `/api/dashboard` (direct DB stats)

Important files:
- `mobileApiService.js` handles all calls to mobile backend and **retries** failed requests.
- `adminController.js` proxies sessions/scans/users and enriches data.
- `databaseService.js` connects to MongoDB.

**Health check**:
- `GET /api/admin/health/mobile-api` tests mobile API connectivity.

---

## 6) Frontend (What It Does)

- `HashRouter` is used (important for Electron packaging)
- `AppShell` contains the notification bell + theme toggle
- `apiClient.js` uses:
  - `REACT_APP_DESKTOP_API` as base URL
  - `REACT_APP_DESKTOP_SERVICE_TOKEN` as fallback token when no admin token exists
  - adds `mobile-token` header for admin endpoints

Page usage highlights:
- Dashboard: `/api/admin/dashboard`, `/api/admin/departments`, `/api/admin/sessions`, `/api/admin/users`
- Sessions/History/All Screens: `/api/admin/sessions`, `/api/admin/scans`
- Notifications: uses sessions + scan rows grouped by status

---

## 7) MongoDB Collections (Observed)

Primary collections used:
- `users` (technicians/admins)
- `tasksessions` (scan sessions)
- `screens` (individual scans)

The desktop backend expects these names; do not rename unless you update all queries.

---

## 8) Notifications System (Known Fix)

### How it works now
- `AppShell.jsx` polls `/api/admin/sessions` every ~15s.
- It builds scan rows and counts new scans per status (healthy, repairable, beyond repair).
- Notification bell shows total NEW count and **shakes until clicked**.

### Two separate �seen� counters
- `notifications.lastSeenCounts` -> used by Notifications page (NEW badge per category)
- `notifications.lastBellSeenCounts` -> used by dashboard bell only

Why this matters: if the bell overwrites the page counter, category NEW badges disappear. That bug was fixed by separating the keys.

---

## 9) Common Failure Modes + Fixes (What We Actually Hit)

1) **�Cannot connect to mobile API�**
   - Cause: mobile backend not running or wrong `MOBILE_API_URL`.
   - Fix: Start mobile backend on port 5002 OR set `MOBILE_API_URL` to Render URL.
   - Use health check: `/api/admin/health/mobile-api`.

2) **401/403 from mobile API**
   - Cause: missing/invalid shared JWT or missing `mobile-token` header.
   - Fix: Ensure `MOBILE_ADMIN_TOKEN` is a real JWT, same `JWT_SECRET` on both backends.

3) **Dashboard/Departments show zeros**
   - Cause: token mismatch or missing mobile headers.
   - Fix: confirm `mobileApiService` sends both headers; verify env.

4) **Notifications bell not updating**
   - Cause: old logic used session total counts; ignored category-based counts.
   - Fix: AppShell now uses scan rows + status filters like Notifications page.

5) **Build error: InsightsPage default export missing**
   - Cause: `src/pages/Insights/InsightsPage.jsx` lacked `export default` component.
   - Fix: ensure component returns full JSX with default export.

---

## 10) Fetching From the Mobile Backend (Exact Steps)

Desktop backend always calls the mobile backend. The correct call path is:

1. Desktop frontend -> desktop backend (`/api/admin/...`) with admin JWT
2. Desktop backend -> mobile backend using shared JWT in **two headers**:
   - `Authorization: Bearer <MOBILE_ADMIN_TOKEN>`
   - `mobile-token: <MOBILE_ADMIN_TOKEN>`

Primary endpoints called on mobile backend:
- `GET /api/scan/history/all`
- `GET /api/departments`
- `GET /api/sessions`
- `POST /api/scan/notify`
- `DELETE /api/scan/delete`

If these fail, check:
- `MOBILE_API_URL` (dev vs prod)
- mobile backend logs
- JWT expiry / mismatch

---

## 11) Environment Files (IMPORTANT)

`.env`, `.env.development`, `.env.production` are now **ignored by git**.

For production (Render):
- Set all env vars in Render UI or `render.yaml`.
- Do NOT commit secrets to repo.

Critical env vars:
- `MONGO_URI`, `MONGO_DB_NAME`
- `JWT_SECRET`
- `MOBILE_API_URL`
- `MOBILE_ADMIN_TOKEN` (real JWT)
- `MOBILE_API_KEY` (fallback token)
- `ALLOWED_ORIGINS`
- Frontend: `REACT_APP_DESKTOP_API`, `REACT_APP_MOBILE_API`

---

## 12) Render Deployment (Pre-flight Notes)

Before pushing to Render:
1. **Backend start command must be production** (do not force NODE_ENV=development).
2. Ensure Render env vars use the correct names: code expects `MONGO_URI`, not `MOBILE_DB_URI`.
3. Set `REACT_APP_DESKTOP_API` to the Render backend URL in frontend build.
4. CORS: `ALLOWED_ORIGINS` must include your Render frontend domain.
5. Consider removing public tokens from frontend env (React build exposes them).

---

## 13) Utility Scripts (Backend)

Located in `desktop-backend/scripts/`:
- `update-admin-password.js`
  - updates `Admin` collection (fallback to `users`)
- `system-report.js`
  - outputs full JSON report of users, sessions, screens, data quality
- `maintenance-tasks.js`
  - scheduled tasks: db health, data quality checks

Run with:
- `npm run script:update-admin-password -- --username admin --password NewPass123`
- `npm run script:system-report -- --out report.json`
- `npm run script:maintenance -- --task db-health`

---

## 14) Final Rule for New Developers

If data looks wrong, do NOT touch the frontend first. Verify in this order:
1. Mobile backend is reachable
2. Shared JWT is valid and matches both backends
3. Desktop backend logs show successful mobile calls
4. Desktop backend response is correct
5. Frontend renders the returned JSON

Most historical failures were **backend token + mobile connectivity**, not UI bugs.

---

If anything in this document is unclear or outdated, update ALPHA.md immediately. This file is the first stop for any handover or production incident.


# TWO WAYS TO CHANGE ADMIN CREDITIALS IN FUTURE

Yes — it’s possible, and you already have a script for it.

There’s a script at:
update-admin-password.js

But important:
Right now your login does NOT read the admin from DB.
auth.js uses ENV values (ADMIN_USERNAME / ADMIN_PASSWORD) in memory.
So changing the DB won’t affect login unless we change auth to read from DB.

Two options (your choice)
Option A — Keep env‑based login (no code change)

To change admin password, you must edit Render env (ADMIN_PASSWORD) and redeploy.
The script won’t affect login in this mode.
Option B — Switch admin login to DB (recommended if you want a script)

Update auth to load admin from Admin or users collection.
Then the script will work and you can update credentials anytime.
The script usage (once auth is DB‑based):

node desktop-backend/scripts/update-admin-password.js --username admin --password NewPass123 --env-dir desktop-backend
