# Mobile API Connection Troubleshooting Guide

## Overview
This guide helps diagnose and fix issues with the desktop app's connection to the mobile API.

## Architecture Flow
```
Desktop Frontend (React on port 3000)
  → Desktop Backend (Express on port 5001)
    → Mobile Backend API (Express on port 5002 OR Render.com: https://embroider-scann-app.onrender.com/api)
```

**Note**: For local development, the mobile backend runs on `localhost:5002`. For production, it uses the Render.com URL.

## Quick Diagnostic Steps

### 1. Start Both Backends

**IMPORTANT**: Both backends must be running for the desktop app to work!

```bash
# Terminal 1: Start Mobile Backend (port 5002)
cd Embroider-Scann-App/backend
npm run dev

# Should see:
# ✅ MongoDB connected
# 🚀 Listening on http://0.0.0.0:5002

# Terminal 2: Start Desktop Backend (port 5001)
cd Embroider-Tech-DesktopManagementApp/desktop-backend
npm run dev

# Should see:
# 🚀 Desktop Admin API running on http://0.0.0.0:5001
# [mobileApiService] Configuration: { baseURL: 'http://localhost:5002/api', ... }
```

### 2. Test Mobile API Connection
The backend now includes a health check endpoint:

```bash
# Get admin token first (login via frontend or use existing token)
# Then test mobile API connection:
curl -X GET http://localhost:5001/api/admin/health/mobile-api \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "mobile-token: franceman99"
```

### 3. Check Environment Variables
Ensure these are set in `desktop-backend/.env` or environment:

```env
MOBILE_API_URL=https://embroider-scann-app.onrender.com/api
MOBILE_API_KEY=franceman99
MOBILE_ADMIN_TOKEN=franceman99
```

### 4. Verify Mobile API Accessibility
Test the mobile API directly:

```bash
curl -X GET https://embroider-scann-app.onrender.com/api/departments \
  -H "Authorization: Bearer franceman99"
```

## Common Issues and Solutions

### Issue 1: "Cannot connect to mobile API" (ECONNREFUSED)
**Symptoms:**
- Error: `ECONNREFUSED` on `localhost:5002`
- Dashboard shows "Failed to load data"
- Logs show: `Cannot connect to mobile API at http://localhost:5002/api`

**Solutions:**
1. **VERIFY MOBILE BACKEND IS RUNNING** (Most Common Issue!)
   ```bash
   # Check if mobile backend is running on port 5002
   cd Embroider-Scann-App/backend
   npm run dev
   
   # Should see:
   # ✅ MongoDB connected
   # 🚀 Listening on http://0.0.0.0:5002
   ```

2. **Check if port 5002 is already in use:**
   ```bash
   # Windows
   netstat -ano | findstr :5002
   
   # If something is using it, kill the process or use a different port
   ```

3. **Verify desktop backend configuration:**
   - Check `.env` file in `desktop-backend/` folder
   - Should have: `MOBILE_API_URL=http://localhost:5002/api`
   - Or remove it to use production URL: `https://embroider-scann-app.onrender.com/api`

4. **For Production (Render.com):**
   - Render.com services may be sleeping (free tier)
   - First request after inactivity may take 30-60 seconds
   - Set `MOBILE_API_URL=https://embroider-scann-app.onrender.com/api` in production

### Issue 2: "Mobile backend token required"
**Symptoms:**
- Error: `401 Unauthorized`
- Missing `mobile-token` header

**Solutions:**
1. **Ensure mobile token is stored:**
   ```javascript
   // In browser console:
   localStorage.getItem('mobileToken')
   // Should return: "franceman99" or similar
   ```

2. **Re-fetch mobile token:**
   - Log out and log back in
   - The login process should automatically fetch and store the mobile token

3. **Check backend token configuration:**
   - Verify `MOBILE_ADMIN_TOKEN` is set in backend environment
   - Default fallback is `franceman99`

### Issue 3: "Mobile API returned 401/403"
**Symptoms:**
- Error: `401 Unauthorized` or `403 Forbidden`
- Token authentication failing

**Solutions:**
1. **Verify token is correct:**
   - Check `MOBILE_API_KEY` matches mobile backend's expected token
   - Default is `franceman99`

2. **Check token format:**
   - Mobile API expects: `Authorization: Bearer <token>`
   - Ensure token doesn't have extra spaces or newlines

3. **Test with different token:**
   - Contact mobile backend admin to verify correct token
   - Update `MOBILE_API_KEY` in environment variables

### Issue 4: "Mobile API returned 500"
**Symptoms:**
- Error: `500 Internal Server Error`
- Mobile backend is having issues

**Solutions:**
1. **Check mobile backend logs:**
   - Log into Render.com dashboard
   - Check mobile backend service logs for errors

2. **Verify mobile backend health:**
   - Test mobile API endpoints directly
   - Check if mobile backend database is accessible

3. **Retry with exponential backoff:**
   - The desktop backend now automatically retries failed requests
   - Wait a few seconds and try again

### Issue 5: Slow Response Times
**Symptoms:**
- Requests taking 30+ seconds
- Timeout errors

**Solutions:**
1. **Render.com cold starts:**
   - Free tier services sleep after inactivity
   - First request after sleep takes longer
   - Consider upgrading to paid tier for always-on service

2. **Increase timeout:**
   - Default timeout is now 45 seconds
   - Can be adjusted via `MOBILE_API_TIMEOUT` environment variable

3. **Check mobile backend performance:**
   - Review mobile backend logs
   - Check database query performance
   - Optimize slow endpoints

## Debugging Tools

### Backend Logs
The backend now includes detailed logging:

```bash
# Look for these log patterns:
[mobileApiService] Configuration: { baseURL, timeout, apiKey }
[mobileApiService] GET /departments → 200 (1234ms)
[mobileApiService] GET /departments failed: { status, code, message }
```

### Frontend Console
Check browser console for:

```javascript
// API client debug logs (in development mode):
[apiClient] Building headers for admin endpoint
[AppDataProvider] Data loading error: { message, status, code }
```

### Network Tab
In browser DevTools → Network tab:
1. Filter by "api/admin" or "api/dashboard"
2. Check request headers:
   - `Authorization: Bearer <admin-token>`
   - `mobile-token: <mobile-token>`
3. Check response status and body

## Testing Checklist

- [ ] Desktop backend starts without errors
- [ ] Mobile API is accessible (test with curl)
- [ ] Admin login works and stores tokens
- [ ] Mobile token is fetched and stored in localStorage
- [ ] Dashboard loads data successfully
- [ ] Departments endpoint returns data
- [ ] Sessions endpoint returns data
- [ ] Error messages are clear and helpful

## Environment Variables Reference

### Desktop Backend (`desktop-backend/.env`)
```env
# Mobile API Configuration
MOBILE_API_URL=https://embroider-scann-app.onrender.com/api
MOBILE_API_KEY=franceman99
MOBILE_ADMIN_TOKEN=franceman99
MOBILE_API_TIMEOUT=45000

# Desktop Backend
PORT=5001
JWT_SECRET=your-secret-key-here
MONGO_URI=mongodb+srv://...
```

### Frontend (`.env` or `.env.development`)
```env
REACT_APP_DESKTOP_API=http://localhost:5001
REACT_APP_DESKTOP_SERVICE_TOKEN=franceman99
```

## Support

If issues persist:
1. Check backend logs for detailed error messages
2. Test mobile API endpoints directly
3. Verify all environment variables are set correctly
4. Check network connectivity and firewall settings
5. Review Render.com service status and logs

## Recent Improvements

✅ Enhanced error handling with retry logic
✅ Better error messages for network issues
✅ Connection health check endpoint
✅ Automatic token fallback mechanism
✅ Increased timeout for slow connections
✅ Comprehensive logging for debugging

