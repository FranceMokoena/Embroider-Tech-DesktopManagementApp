@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    EmbroideryTech Installer Builder
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

:: Check if required dependencies are installed
echo Checking dependencies...
npm list electron-builder >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing electron-builder...
    npm install --save-dev electron-builder
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install electron-builder
        pause
        exit /b 1
    )
)

:: Clean previous builds
echo Cleaning previous builds...
if exist "dist" (
    rmdir /s /q "dist"
)
if exist "build" (
    rmdir /s /q "build"
)

:: Install dependencies
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

:: Install backend dependencies
echo Installing backend dependencies...
cd desktop-backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

:: Build React application
echo Building React application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build React application
    pause
    exit /b 1
)

:: Create installer
echo Creating Windows installer...
npm run create-installer
if %errorlevel% neq 0 (
    echo ERROR: Failed to create installer
    pause
    exit /b 1
)

:: Check if installer was created
if exist "dist\EmbroideryTech-Management-Setup-*.exe" (
    echo.
    echo ========================================
    echo    SUCCESS: Installer Created!
    echo ========================================
    echo.
    echo Installer location: dist\
    echo.
    dir dist\*.exe /b
    echo.
    echo The installer is ready for distribution!
    echo.
) else (
    echo ERROR: Installer file not found
    echo Check the dist\ directory for any generated files
    pause
    exit /b 1
)

:: Open dist folder
echo Opening dist folder...
start "" "dist"

echo.
echo Build completed successfully!
pause
