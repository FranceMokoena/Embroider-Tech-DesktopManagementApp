# 🖥️ EmbroideryTech Desktop Application Guide

## 🚀 Quick Start Options

### Option 1: Automatic Start (Recommended)
```bash
# Windows Batch File
start-desktop-app.bat

# OR PowerShell Script
.\start-desktop-app.ps1
```

### Option 2: Manual Start (Step by Step)
```bash
# Step 1: Start Backend
cd desktop-backend
npm start

# Step 2: Start React Frontend (in new terminal)
npm start

# Step 3: Wait for React to load, then start Electron (in new terminal)
npm run electron
```

## 📋 What Each Component Does

### 🔧 Backend (Port 5001)
- **Purpose**: API server that connects to MongoDB database
- **URL**: `http://localhost:5001`
- **Status**: Shows "✅ Desktop Admin API is running"

### 🌐 React Frontend (Port 3000)
- **Purpose**: Web interface for the dashboard
- **URL**: `http://localhost:3000`
- **Status**: Shows React logo and "Welcome to React"

### 🖥️ Electron Desktop App
- **Purpose**: Desktop window wrapper for the React app
- **Dependency**: Requires React frontend to be running first
- **Status**: Opens desktop window with dashboard

## 🔐 Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

## ⚠️ Common Issues & Solutions

### Issue 1: Electron Shows Blank White Screen
**Cause**: React frontend isn't running yet

**Solutions**:
1. **Wait longer**: React takes 30-60 seconds to start
2. **Check React**: Open `http://localhost:3000` in browser
3. **Reload Electron**: Press `Ctrl+R` in Electron window
4. **Restart Electron**: Run `npm run electron` again

### Issue 2: "ERR_CONNECTION_REFUSED" Error
**Cause**: React server not running on port 3000

**Solutions**:
1. **Start React first**: Run `npm start` and wait for it to load
2. **Check port**: Make sure port 3000 is not used by another app
3. **Kill processes**: Restart computer or kill processes using port 3000

### Issue 3: Backend Connection Failed
**Cause**: Backend not running or database connection issue

**Solutions**:
1. **Start backend**: Run `cd desktop-backend && npm start`
2. **Check database**: Verify `.env` file in `desktop-backend/`
3. **Test connection**: Run `node test-database.js`

### Issue 4: Login Fails
**Cause**: Authentication issue

**Solutions**:
1. **Use correct credentials**: `admin` / `admin123`
2. **Check backend**: Make sure backend is running on port 5001
3. **Clear browser cache**: Clear cookies and local storage

## 🎯 Proper Startup Sequence

### ✅ Correct Order:
1. **Backend** → `cd desktop-backend && npm start`
2. **Wait 5 seconds** for backend to start
3. **React Frontend** → `npm start`
4. **Wait 30-60 seconds** for React to fully load
5. **Electron** → `npm run electron`

### ❌ Wrong Order:
- Starting Electron before React (causes blank screen)
- Starting React before Backend (causes connection errors)

## 🔍 Troubleshooting Commands

### Test Backend:
```bash
cd desktop-backend
node test-database.js
```

### Test Frontend:
```bash
node test-dashboard.js
```

### Check Ports:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5001

# Kill process using port (replace PID)
taskkill /PID <PID> /F
```

### Check React Status:
```bash
# Should show React development server
curl http://localhost:3000
```

### Check Backend Status:
```bash
# Should show API status
curl http://localhost:5001
```

## 🎨 Features Available

### 📊 Dashboard Overview
- Total technicians, sessions, scans
- Today's and weekly statistics
- Status breakdown (Healthy, Reparable, Beyond Repair)
- Department statistics

### 👥 Technician Management
- View all technicians
- Department information
- Professional user cards

### 📱 Scan History
- Filter by technician and department
- Color-coded status indicators
- Timestamp information

### ⏱️ Active Sessions
- Session monitoring
- Status indicators
- Scan count tracking

### 🔔 Notifications
- System notifications
- Real-time updates

## 🚀 Performance Tips

1. **Close unnecessary apps** to free up ports
2. **Use SSD** for faster startup times
3. **Close browser tabs** to free up memory
4. **Restart computer** if having persistent issues

## 📞 Support

If you continue having issues:

1. **Check all logs** in the terminal windows
2. **Verify database connection** in `.env` file
3. **Test each component** individually
4. **Restart everything** in the correct order

## 🎉 Success Indicators

You'll know everything is working when:

✅ **Backend**: Shows "✅ Desktop Admin API is running"  
✅ **React**: Shows React logo and loads dashboard  
✅ **Electron**: Opens desktop window with dashboard  
✅ **Login**: Successfully logs in with admin/admin123  
✅ **Data**: Shows real data from your mobile app's database  

---

**🎯 Your professional embroidery tech desktop application is ready to use!**
