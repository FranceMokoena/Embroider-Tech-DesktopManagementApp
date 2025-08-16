@echo off
echo 🚀 Starting EmbroideryTech Desktop Application (Fixed Version)...
echo.

echo 🔧 Killing existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo 📊 Starting Desktop Backend...
cd desktop-backend
start "Desktop Backend" cmd /k "npm start"
cd ..

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 🌐 Starting React Frontend...
start "React Frontend" cmd /k "npm start"

echo.
echo ⏳ Waiting for React server to be ready...
echo    This may take 30-60 seconds...
echo    Watch for "Local: http://localhost:3000" in the React terminal
timeout /t 60 /nobreak > nul

echo 🔍 Testing if React is ready...
node check-status.js

echo.
echo 🖥️ Starting Electron Desktop App...
start "Electron Desktop App" cmd /k "npm run electron"

echo.
echo ✅ All applications starting...
echo.
echo 📋 Access URLs:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend:  http://localhost:5001
echo    🖥️ Desktop:  Electron window
echo.
echo 🔐 Login Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo 🎯 Instructions:
echo    1. Wait for React to show "Local: http://localhost:3000"
echo    2. The Electron window will open automatically
echo    3. Login with admin/admin123
echo    4. View the professional dashboard with real data!
echo.
echo ⚠️  If Electron shows blank screen:
echo    1. Make sure React shows "Local: http://localhost:3000"
echo    2. Press Ctrl+R in Electron window to reload
echo    3. Or restart Electron: npm run electron
echo.
pause
