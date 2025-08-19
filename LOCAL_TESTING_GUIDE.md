# Local Testing Guide for Embroidery Desktop Application

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (if using database features)

## Quick Start (Recommended)

### 1. Install All Dependencies
```bash
npm run install-all
```

### 2. Start the Full Application (Backend + Electron)
```bash
npm run dev
```

This will:
- Start the backend server on port 5001
- Start the React development server on port 3000
- Launch the Electron desktop application

## Alternative Testing Methods

### Method 1: Web-Only Testing (React App)
```bash
npm start
```
- Runs only the React frontend on http://localhost:3000
- Good for testing UI components without Electron

### Method 2: Backend-Only Testing
```bash
npm run backend
```
- Runs only the backend API on http://localhost:5001
- Good for testing API endpoints

### Method 3: Electron with Development Server
```bash
npm run electron-dev
```
- Starts React dev server + Electron
- Waits for React server to be ready before launching Electron

## Environment Configuration

### Development Environment
The application uses `.env.development` for local testing:
```
REACT_APP_DESKTOP_API=http://localhost:5001
```

### Backend Configuration
The backend server runs on port 5001 by default and accepts connections from:
- http://localhost:3000 (React dev server)
- http://localhost:3001-3003 (Alternative ports)
- http://localhost:19006 (Expo/React Native)

## Testing Different Components

### Frontend Testing
- **React Components**: Use `npm start` and navigate to http://localhost:3000
- **Electron Features**: Use `npm run dev` for full desktop experience
- **Admin Login**: Test admin authentication features
- **Dashboard**: Test management interface

### Backend Testing
- **API Endpoints**: Use `npm run backend` and test via:
  - http://localhost:5001/api/auth
  - http://localhost:5001/api/admin
  - http://localhost:5001/api/reports
  - http://localhost:5001/api/messaging
  - http://localhost:5001/api/dashboard
  - http://localhost:5001/api/database

### Health Check
Visit http://localhost:5001 to verify the backend is running.

## Troubleshooting

### Port Conflicts
If ports are already in use:
- Backend: Change PORT in `.env.development` or backend environment
- Frontend: React will automatically suggest an alternative port

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
cd desktop-backend && rm -rf node_modules package-lock.json
cd ..
npm run install-all
```

### Electron Issues
- Ensure you're on Windows (application is configured for Windows builds)
- Check that all dependencies are properly installed

## Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `src/` or `desktop-backend/src/`
3. **Hot Reload**: Changes will automatically reload
4. **Test Features**: Use the desktop application or web interface
5. **Stop**: Ctrl+C in terminal to stop all services

## Build for Production

### Windows Executable
```bash
npm run build-windows
```

### Distribution Package
```bash
npm run dist
```

## Notes
- The Render deployment remains untouched and separate from local testing
- Local testing uses localhost URLs and doesn't affect the production deployment
- Database connections can be configured separately for local vs production
