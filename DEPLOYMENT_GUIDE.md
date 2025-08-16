# 🚀 Embroidery Tech Desktop App - Production Deployment Guide

## 📋 Prerequisites
- Render account (for backend deployment)
- Node.js 16+ installed
- Git repository access

## 🔧 Step 1: Backend Deployment to Render

### 1.1 Prepare Backend for Deployment
```bash
cd desktop-backend
```

### 1.2 Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `embroidery-tech-desktop-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 1.3 Environment Variables
Set these in Render dashboard:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=[generate a secure random string]
JWT_EXPIRES_IN=24h
MOBILE_DB_URI=[your MongoDB Atlas connection string]
MOBILE_DB_NAME=ScreenScannerTechDetails
MOBILE_API_URL=https://embroider-scann-app.onrender.com/api
MOBILE_API_KEY=[your API key]
MOBILE_ADMIN_TOKEN=[your admin token]
ALLOWED_ORIGINS=*
```

### 1.4 Get Backend URL
After deployment, note your backend URL: `https://your-app-name.onrender.com`

## 🔧 Step 2: Update Frontend Configuration

### 2.1 Update Production Environment
Edit `.env.production`:
```
REACT_APP_DESKTOP_API=https://your-backend-url.onrender.com
GENERATE_SOURCEMAP=false
```

## 🔧 Step 3: Build Desktop Application

### 3.1 Install Dependencies
```bash
npm run install-all
```

### 3.2 Build for Production
```bash
# Build React app
npm run build

# Build Windows executable
npm run build-windows
```

### 3.3 Find Your Executable
The Windows installer will be in: `dist/Embroidery Tech Management Setup.exe`

## 🎯 Step 4: Distribution

### 4.1 Test the Application
1. Run the installer on a Windows machine
2. Test login/registration functionality
3. Verify all features work with deployed backend

### 4.2 Distribute to Clients
- Share the `.exe` file with your clients
- Provide installation instructions
- Include any necessary documentation

## 🔧 Development vs Production

### Development Mode
```bash
npm run dev  # Runs both backend and desktop app locally
```

### Production Mode
```bash
npm run build-windows  # Creates Windows executable
```

## 🛠️ Troubleshooting

### Common Issues:
1. **Backend Connection Failed**: Check if Render service is running
2. **Build Errors**: Ensure all dependencies are installed
3. **App Won't Start**: Check if logo.png exists in public folder

### Logs:
- Backend logs: Available in Render dashboard
- Desktop app logs: Check Windows Event Viewer

## 📞 Support
For issues with the deployed application, check:
1. Render service status
2. MongoDB Atlas connection
3. Environment variables configuration

## 🎉 Success!
Your professional desktop application is now ready for client distribution!
