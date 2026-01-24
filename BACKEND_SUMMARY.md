## Desktop Backend Overview

1. **Entry point (`desktop-backend/src/server.js`)**
   - Sets up Express with security, compression, CORS, and rate limits.
   - Serves a simple health check and mounts route groups under `/api/auth`, `/api/admin`, `/api/reports`, `/api/messaging`, `/api/dashboard`, `/api/database`.
   - Routes delegate to controllers with centralized error and 404 handling.

2. **Admin controller responsibilities (`controllers/adminController.js`)**
   - Provides a hard-coded mobile token for desktop calls that must align with the mobile backend.
   - Returns stubbed dashboard stats (overview, status breakdown, recent activity).
   - Manages user accounts: get all users, create, update, delete (hashes passwords, enforces uniqueness).
   - Handles scans: list all scans, proxy read/update/delete/archive via `mobileApiService`, and clean up scan/session data in MongoDB.
   - Handles sessions: proxy list/fetch via mobile API and delete (also removes related scans).
   - Supports search operations for scans and users through mobile API filters.

3. **Data layer**
   - `databaseService` exposes MongoDB collections for `users`, `screens`, `tasksessions`.
   - Controllers combine direct database access with calls to `mobileApiService` when a valid `mobile-token` header is supplied.

4. **Flows to align**
   - Technician listings and CRUD should hit `/api/admin/users` endpoints.
   - Session/scan views should call `/api/admin/sessions` or `/api/admin/scans`, with filters and export behavior matching the APIs’ expected query parameters.
   - All desktop interactions that modify scans/sessions must forward `mobile-token` to succeed.

I have read and understood the backend structure; let me know when to load the mobile backend details so we can align the front end accordingly.
