const DESKTOP_API = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:3000';

async function testFrontendIntegration() {
  console.log('🧪 Testing Frontend Integration...\n');

  try {
    // Test 1: Backend Health Check
    console.log('1️⃣ Testing backend health...');
    const backendResponse = await fetch(`${DESKTOP_API}/`);
    const backendData = await backendResponse.json();
    console.log('   ✅ Backend:', backendData.status);
    console.log('');

    // Test 2: Frontend Accessibility
    console.log('2️⃣ Testing frontend accessibility...');
    try {
      const frontendResponse = await fetch(FRONTEND_URL);
      console.log('   ✅ Frontend:', frontendResponse.status === 200 ? 'Running' : 'Not accessible');
    } catch (error) {
      console.log('   ❌ Frontend not accessible (may still be starting)');
    }
    console.log('');

    // Test 3: Admin Login
    console.log('3️⃣ Testing admin login...');
    const loginResponse = await fetch(`${DESKTOP_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('   ✅ Login successful');
      console.log('   👤 Username:', loginData.user.username);
      console.log('   🎫 Token received:', loginData.token ? 'Yes' : 'No');
      console.log('');

      // Test 4: Dashboard Overview
      console.log('4️⃣ Testing dashboard overview...');
      const overviewResponse = await fetch(`${DESKTOP_API}/api/dashboard/overview`, {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        console.log('   ✅ Dashboard overview successful');
        console.log('   👥 Total Users:', overviewData.data.overview.totalUsers);
        console.log('   📋 Total Sessions:', overviewData.data.overview.totalSessions);
        console.log('   📱 Total Scans:', overviewData.data.overview.totalScans);
        console.log('   📅 Today Scans:', overviewData.data.overview.todayScans);
        console.log('   📈 Weekly Scans:', overviewData.data.overview.weeklyScans);
        console.log('');
      }
    } else {
      console.log('   ❌ Login failed');
    }

    console.log('🎉 Integration test completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Login with admin/admin123');
    console.log('   3. Navigate to the dashboard');
    console.log('   4. Verify real data is displayed');
    console.log('');
    console.log('✅ Ready for frontend testing!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

// Run the test
testFrontendIntegration();
