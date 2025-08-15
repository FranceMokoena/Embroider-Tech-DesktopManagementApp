# Quick Start Guide - Desktop App Development

## 🚀 Immediate Setup (5 minutes)

### 1. Start Desktop Backend
```bash
cd desktop-backend
npm install
npm start
```
**Expected output:** `🚀 Desktop Admin API running on http://0.0.0.0:5001`

### 2. Start Desktop Frontend
```bash
# In the root directory
npm start
```
**Expected output:** React app opens at `http://localhost:3000`

### 3. Configure Mobile API Connection
Create `desktop-backend/.env` file:
```env
# Mobile API Configuration
MOBILE_API_URL=https://embroider-scann-app.onrender.com/api
MOBILE_API_KEY=your_mobile_api_key
MOBILE_ADMIN_TOKEN=your_mobile_admin_token

# Server Configuration
PORT=5001
NODE_ENV=development
```

**Or run the setup script:**
```bash
chmod +x setup-mobile-integration.sh
./setup-mobile-integration.sh
```

## 🔧 Troubleshooting

### If you get "404 Not Found" errors:
1. **Check if desktop backend is running:**
   ```bash
   curl http://localhost:5001
   # Should return: {"status":"✅ Desktop Admin API is running",...}
   ```

2. **Check if mobile token endpoint exists:**
   ```bash
   curl http://localhost:5001/api/auth/mobile-token
   # Should return: {"error":"Mobile backend token not configured"}
   ```

3. **Verify environment variables:**
   - Make sure `desktop-backend/.env` exists
   - Check that `MOBILE_API_URL`, `MOBILE_API_KEY`, and `MOBILE_ADMIN_TOKEN` are set

### If you get CORS errors:
- The desktop backend is configured to allow `http://localhost:3000`
- Check that your React app is running on port 3000

### If you get authentication errors:
- The desktop app uses its own admin authentication
- You may need to create an admin user or use default credentials

## 📱 Mobile API Integration

Once you share the mobile API documentation, we'll:
1. Update the `mobileApiService.js` to match your actual API endpoints
2. Configure the correct authentication method
3. Map the data structures to match your mobile app

## 🎯 Next Steps

1. **Share your mobile API documentation** - I'll help configure the integration
2. **Test the connection** - Verify data flows from mobile to desktop
3. **Customize the dashboard** - Add specific features for your use case

---

**Current Status:** Desktop app is configured for local development. Ready to integrate with your mobile API once you share the documentation.
