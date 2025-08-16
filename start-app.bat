@echo off
echo 🚀 Starting EmbroideryTech Desktop Application...
echo.

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
echo ✅ Application starting...
echo.
echo 📋 Access URLs:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend:  http://localhost:5001
echo.
echo 🔐 Login Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo 🎯 Instructions:
echo    1. Wait for both servers to start
echo    2. Open http://localhost:3000 in your browser
echo    3. Login with admin/admin123
echo    4. View the professional dashboard with real data!
echo.
pause
