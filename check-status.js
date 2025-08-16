const fetch = require('node-fetch');

async function checkStatus() {
  console.log('🔍 Checking application status...\n');

  // Check Backend
  try {
    const backendResponse = await fetch('http://localhost:5001');
    const backendData = await backendResponse.json();
    console.log('✅ Backend (Port 5001):', backendData.status);
  } catch (error) {
    console.log('❌ Backend (Port 5001): Not running');
  }

  // Check React Frontend
  try {
    const frontendResponse = await fetch('http://localhost:3000');
    if (frontendResponse.ok) {
      console.log('✅ React Frontend (Port 3000): Running');
    } else {
      console.log('❌ React Frontend (Port 3000): Not responding properly');
    }
  } catch (error) {
    console.log('❌ React Frontend (Port 3000): Not running');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If both are ✅, you can start Electron: npm run electron');
  console.log('2. If React is ❌, wait longer or restart: npm start');
  console.log('3. If Backend is ❌, start it: cd desktop-backend && npm start');
}

checkStatus();
