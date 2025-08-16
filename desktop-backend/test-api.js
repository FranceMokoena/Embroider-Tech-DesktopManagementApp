import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get('http://localhost:5001/');
    console.log('   ✅ Health check:', healthResponse.data.status);
    console.log('');

    // Test 2: Admin Login
    console.log('2️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('   ✅ Login successful');
    console.log('   👤 Username:', loginResponse.data.user.username);
    console.log('   🎫 Token received:', loginResponse.data.token ? 'Yes' : 'No');
    console.log('');

    const token = loginResponse.data.token;

    // Test 3: Dashboard Overview
    console.log('3️⃣ Testing dashboard overview...');
    const overviewResponse = await axios.get(`${BASE_URL}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Dashboard overview successful');
    console.log('   📊 Data structure:', Object.keys(overviewResponse.data.data));
    console.log('   👥 Total Users:', overviewResponse.data.data.overview.totalUsers);
    console.log('   📋 Total Sessions:', overviewResponse.data.data.overview.totalSessions);
    console.log('   📱 Total Scans:', overviewResponse.data.data.overview.totalScans);
    console.log('');

    // Test 4: Get Users (Technicians)
    console.log('4️⃣ Testing users endpoint...');
    const usersResponse = await axios.get(`${BASE_URL}/dashboard/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Users fetch successful');
    console.log('   👥 Technicians found:', usersResponse.data.data.length);
    if (usersResponse.data.data.length > 0) {
      console.log('   📄 Sample technician:', {
        name: usersResponse.data.data[0].name,
        department: usersResponse.data.data[0].department
      });
    }
    console.log('');

    // Test 5: Get Sessions
    console.log('5️⃣ Testing sessions endpoint...');
    const sessionsResponse = await axios.get(`${BASE_URL}/dashboard/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Sessions fetch successful');
    console.log('   📋 Sessions found:', sessionsResponse.data.data.length);
    console.log('');

    // Test 6: Get Scan History
    console.log('6️⃣ Testing scan history endpoint...');
    const scanHistoryResponse = await axios.get(`${BASE_URL}/dashboard/scan-history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Scan history fetch successful');
    console.log('   📱 Scans found:', scanHistoryResponse.data.scans.length);
    console.log('   📊 Stats:', scanHistoryResponse.data.stats);
    console.log('');

    console.log('🎉 All API endpoints working correctly!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - Health Check: ✅');
    console.log('   - Authentication: ✅');
    console.log('   - Dashboard Overview: ✅');
    console.log('   - Users/Technicians: ✅');
    console.log('   - Sessions: ✅');
    console.log('   - Scan History: ✅');
    console.log('');
    console.log('✅ Ready to connect to frontend!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data.error);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Make sure the desktop backend is running: npm start');
      console.log('   2. Check if port 5001 is available');
      console.log('   3. Verify the server started without errors');
    }
  }
}

// Run the test
testAPIEndpoints();
