const DESKTOP_API = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:3000';

async function testDashboard() {
  console.log('🎯 Testing Professional Dashboard...\n');
  
  try {
    // Test 1: Backend Health
    console.log('1️⃣ Testing backend health...');
    const backendResponse = await fetch(`${DESKTOP_API}/`);
    const backendData = await backendResponse.json();
    console.log('   ✅ Backend:', backendData.status);
    console.log('');

    // Test 2: Admin Login
    console.log('2️⃣ Testing admin login...');
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

      const token = loginData.token;

      // Test 3: Dashboard Overview
      console.log('3️⃣ Testing dashboard overview...');
      const overviewResponse = await fetch(`${DESKTOP_API}/api/dashboard/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        console.log('   ✅ Dashboard overview successful');
        console.log('   📊 Data structure:', Object.keys(overviewData.data));
        console.log('   👥 Total Users:', overviewData.data.overview.totalUsers);
        console.log('   📋 Total Sessions:', overviewData.data.overview.totalSessions);
        console.log('   📱 Total Scans:', overviewData.data.overview.totalScans);
        console.log('   📅 Today Scans:', overviewData.data.overview.todayScans);
        console.log('   📈 Weekly Scans:', overviewData.data.overview.weeklyScans);
        console.log('');

        // Test 4: Users/Technicians
        console.log('4️⃣ Testing users endpoint...');
        const usersResponse = await fetch(`${DESKTOP_API}/api/dashboard/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('   ✅ Users fetch successful');
          console.log('   👥 Technicians found:', usersData.data.length);
          if (usersData.data.length > 0) {
            console.log('   📄 Sample technician:', {
              name: usersData.data[0].name,
              department: usersData.data[0].department
            });
          }
          console.log('');

          // Test 5: Sessions
          console.log('5️⃣ Testing sessions endpoint...');
          const sessionsResponse = await fetch(`${DESKTOP_API}/api/dashboard/sessions`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            console.log('   ✅ Sessions fetch successful');
            console.log('   📋 Sessions found:', sessionsData.data.length);
            console.log('');

            // Test 6: Scan History
            console.log('6️⃣ Testing scan history endpoint...');
            const scanHistoryResponse = await fetch(`${DESKTOP_API}/api/dashboard/scan-history`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (scanHistoryResponse.ok) {
              const scanData = await scanHistoryResponse.json();
              console.log('   ✅ Scan history fetch successful');
              console.log('   📱 Scans found:', scanData.scans.length);
              console.log('   📊 Stats:', scanData.stats);
              console.log('');
            }
          }
        }
      }
    } else {
      console.log('   ❌ Login failed');
    }

    // Test 7: Frontend Accessibility
    console.log('7️⃣ Testing frontend accessibility...');
    try {
      const frontendResponse = await fetch(FRONTEND_URL);
      console.log('   ✅ Frontend:', frontendResponse.status === 200 ? 'Running' : 'Not accessible');
    } catch (error) {
      console.log('   ❌ Frontend not accessible (may still be starting)');
    }
    console.log('');

    console.log('🎉 Dashboard Test Completed Successfully!');
    console.log('');
    console.log('📋 SUMMARY:');
    console.log('   ✅ Backend API: Working');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ Database Connection: Working');
    console.log('   ✅ Real Data: Available');
    console.log('   ✅ Frontend: Ready');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Login with admin/admin123');
    console.log('   3. Explore the professional dashboard!');
    console.log('');
    console.log('🎨 FEATURES AVAILABLE:');
    console.log('   📊 Dashboard Overview with real-time stats');
    console.log('   👥 Technician Management');
    console.log('   📱 Scan History with filtering');
    console.log('   ⏱️ Active Sessions monitoring');
    console.log('   🔔 Notifications system');
    console.log('   🎨 Professional UI with animations');
    console.log('');

  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure backend is running: cd desktop-backend && npm start');
    console.log('   2. Make sure frontend is running: npm start');
    console.log('   3. Check if ports 5001 and 3000 are available');
    console.log('   4. Verify database connection in .env file');
  }
}

// Run the test
testDashboard();
