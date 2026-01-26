# Quick Start Guide - Desktop Management App

## 🚀 Getting Started

This guide will help you get both backends running so the desktop app can fetch data from the mobile application.

## Prerequisites

- Node.js installed (v14 or higher)
- MongoDB connection configured
- Both backend projects cloned

## Step-by-Step Setup

### Step 1: Start Mobile Backend (Port 5002)

Open **Terminal 1**:

```bash
cd Embroider-Scann-App/backend
npm install  # If not already done
npm run dev
```

**Expected Output:**
```
✅ MongoDB connected
🚀 Listening on http://0.0.0.0:5002
```

**Keep this terminal open!** The mobile backend must stay running.

### Step 2: Start Desktop Backend (Port 5001)

Open **Terminal 2**:

```bash
cd Embroider-Tech-DesktopManagementApp/desktop-backend
npm install  # If not already done
npm run dev
```

**Expected Output:**
```
[mobileApiService] Configuration: {
  baseURL: 'http://localhost:5002/api',
  timeout: 45000,
  apiKey: 'fran...'
}
🚀 Desktop Admin API running on http://0.0.0.0:5001
📊 Admin Dashboard: http://localhost:5001
```

**Keep this terminal open!** The desktop backend must stay running.

### Step 3: Start Desktop Frontend (Port 3000)

Open **Terminal 3**:

```bash
cd Embroider-Tech-DesktopManagementApp
npm install  # If not already done
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view embroidery-desktop in the browser.
  Local:            http://localhost:3000
```

### Step 4: Verify Connection

1. Open browser: http://localhost:3000
2. Log in with admin credentials
3. Check Terminal 2 (Desktop Backend) - you should see:
   ```
   [mobileApiService] GET /scan/history/all → 200 (XXXms)
   [mobileApiService] GET /departments → 200 (XXXms)
   ```

## ✅ Success Indicators

- ✅ Mobile backend shows: `🚀 Listening on http://0.0.0.0:5002`
- ✅ Desktop backend shows: `🚀 Desktop Admin API running on http://0.0.0.0:5001`
- ✅ Desktop backend logs show successful API calls: `→ 200`
- ✅ Frontend dashboard loads data without errors
- ✅ No `ECONNREFUSED` errors in logs

## 🔧 Troubleshooting

### Problem: "Cannot connect to mobile API" (ECONNREFUSED)

**Solution**: Make sure the mobile backend is running!
```bash
# Check Terminal 1 - mobile backend should be running
# If not, start it:
cd Embroider-Scann-App/backend
npm run dev
```

### Problem: Port 5001 or 5002 already in use

**Solution**: Kill the process using the port or change ports in `.env` files.

**Windows:**
```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Problem: Dashboard shows "Failed to load data"

**Check:**
1. ✅ Mobile backend is running (Terminal 1)
2. ✅ Desktop backend is running (Terminal 2)
3. ✅ Check desktop backend logs for error messages
4. ✅ Verify MongoDB connection in mobile backend

## 📝 Environment Configuration

### Desktop Backend (`desktop-backend/.env`)

For **local development**:
```env
MOBILE_API_URL=http://localhost:5002/api
MOBILE_API_KEY=franceman99
MOBILE_ADMIN_TOKEN=franceman99
PORT=5001
```

For **production**:
```env
MOBILE_API_URL=https://embroider-scann-app.onrender.com/api
MOBILE_API_KEY=franceman99
MOBILE_ADMIN_TOKEN=franceman99
PORT=5001
```

### Frontend (`.env` or `.env.development`)

```env
REACT_APP_DESKTOP_API=http://localhost:5001
REACT_APP_DESKTOP_SERVICE_TOKEN=franceman99
```

## 🎯 Development Workflow

1. **Always start mobile backend first** (Terminal 1)
2. **Then start desktop backend** (Terminal 2)
3. **Finally start frontend** (Terminal 3)
4. **Keep all three terminals running** during development

## 📊 Monitoring

Watch the logs in Terminal 2 (Desktop Backend) to monitor API calls:
- ✅ `→ 200` = Success
- ❌ `failed (ECONNREFUSED)` = Mobile backend not running
- ❌ `failed (401/403)` = Authentication issue
- ⏱️ `retrying in Xms` = Automatic retry (normal behavior)

## 🆘 Need Help?

1. Check `MOBILE_API_TROUBLESHOOTING.md` for detailed troubleshooting
2. Verify all three services are running
3. Check logs for specific error messages
4. Ensure MongoDB is connected in mobile backend

---

**Remember**: The desktop app needs BOTH backends running to work properly!

