# Environment Variables Setup Guide

## Required Environment Variables

Based on the mobile backend integration requirements, ensure these environment variables are set correctly.

### Desktop Backend (`desktop-backend/.env`)

```env
# JWT Configuration (MUST match mobile backend)
JWT_SECRET=franceman99
MOBILE_ADMIN_TOKEN=<shared JWT token signed with JWT_SECRET>
DESKTOP_SERVICE_TOKEN=franceman99

# Mobile API Configuration
MOBILE_API_URL=http://localhost:5002/api
# OR for production:
# MOBILE_API_URL=https://embroider-scann-app.onrender.com/api

MOBILE_API_KEY=franceman99
MOBILE_API_TIMEOUT=45000

# Desktop Backend
PORT=5001

# MongoDB (if needed for local user management)
MONGO_URI=mongodb+srv://France:FranceMan99@screenscannertechdetail.ac4f8mr.mongodb.net/?retryWrites=true&w=majority&appName=ScreenScannerTechDetails
MONGO_DB_NAME=EmbronderiesDB

# Admin User (for desktop login)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@embroiderytech.com
```

### Frontend (`.env` or `.env.development`)

```env
REACT_APP_DESKTOP_API=http://localhost:5001
REACT_APP_DESKTOP_SERVICE_TOKEN=franceman99
```

## Important Notes

### 1. JWT Token Format

The `MOBILE_ADMIN_TOKEN` should be a **proper JWT token** signed with `JWT_SECRET=franceman99`, NOT just the string "franceman99".

**Example JWT payload:**
```json
{
  "userId": "desktop-service",
  "isAdmin": true,
  "iat": 1234567890,
  "exp": 1234654290
}
```

### 2. Shared Secrets

Both desktop and mobile backends MUST have:
- Same `JWT_SECRET` (franceman99)
- Same `MOBILE_ADMIN_TOKEN` (shared JWT)
- Same `DESKTOP_SERVICE_TOKEN` (franceman99)

### 3. Request Headers

Desktop backend sends to mobile API:
- `Authorization: Bearer <shared JWT>`
- `mobile-token: <same shared JWT>`

Both headers must contain the **same JWT token**.

### 4. CORS Configuration

Mobile backend allows:
- Origins: `https://embroider-scann-app.onrender.com`, `http://localhost:*`, `exp://127.0.0.1:19000`
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Authorization, mobile-token
- Preflight cache: 24 hours

### 5. Endpoints

Desktop should use these mobile API endpoints:
- `/api/scan/history/all` - Get scan history
- `/api/departments` - Get departments
- `/api/auth/mobile-token` - Get mobile token (if needed)
- `/api/sessions` - Session management

## Verification Checklist

- [ ] `JWT_SECRET` matches in both desktop and mobile `.env` files
- [ ] `MOBILE_ADMIN_TOKEN` is a proper JWT (not just "franceman99")
- [ ] `MOBILE_API_URL` points to correct backend (localhost:5002 for dev, Render.com for prod)
- [ ] Desktop backend sends both `Authorization` and `mobile-token` headers
- [ ] Both headers contain the same JWT token
- [ ] MongoDB connection string is correct
- [ ] Database name matches (`EmbronderiesDB`)

## Generating JWT Token

If you need to generate a new JWT token for `MOBILE_ADMIN_TOKEN`:

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    userId: 'desktop-service',
    isAdmin: true
  },
  'franceman99', // JWT_SECRET
  { expiresIn: '365d' } // Long expiration for service token
);

console.log('MOBILE_ADMIN_TOKEN:', token);
```

Then set this token in both desktop and mobile backend `.env` files.

