// Test script to verify desktop backend integration with mobile app
const DESKTOP_API = 'https://embroider-tech-desktopmanagementapp.onrender.com';

async function testIntegration() {
  console.log('🧪 Testing Desktop Backend Integration...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${DESKTOP_API}/`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test 2: Admin login
    console.log('\n2️⃣ Testing admin login...');
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
      console.log('✅ Login successful, token received');
      
      // Test 3: Get mobile token
      console.log('\n3️⃣ Testing mobile token retrieval...');
      const tokenResponse = await fetch(`${DESKTOP_API}/api/auth/mobile-token`, {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        console.log('✅ Mobile token received:', tokenData.mobileToken ? 'Yes' : 'No');
        
        // Test 4: Fetch scan history from mobile app
        console.log('\n4️⃣ Testing mobile app data fetch...');
        const scanResponse = await fetch(`${DESKTOP_API}/api/dashboard/scan-history`, {
          headers: {
            Authorization: `Bearer ${loginData.token}`,
            'mobile-token': tokenData.mobileToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (scanResponse.ok) {
          const scanData = await scanResponse.json();
          console.log('✅ Scan data fetched successfully');
          console.log('📊 Total scans:', scanData.data?.length || 0);
        } else {
          console.log('❌ Failed to fetch scan data:', scanResponse.status);
        }
      } else {
        console.log('❌ Failed to get mobile token:', tokenResponse.status);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testIntegration();
