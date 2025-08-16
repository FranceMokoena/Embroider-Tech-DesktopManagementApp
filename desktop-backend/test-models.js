import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import Technician from './src/models/Technician.js';
import TaskSession from './src/models/TaskSession.js';
import Screen from './src/models/Screen.js';

async function testModels() {
  console.log('🧪 Testing Data Models...\n');

  try {
    // Test 1: Technician Model
    console.log('1️⃣ Testing Technician Model...');
    const technicianStats = await Technician.getTechnicianStats();
    console.log('   ✅ Technician Stats:', technicianStats.success ? 'SUCCESS' : 'FAILED');
    if (technicianStats.success) {
      console.log('   📊 Total Technicians:', technicianStats.data.totalTechnicians);
      console.log('   🏢 Department Stats:', technicianStats.data.departmentStats);
    }
    console.log('');

    const allTechnicians = await Technician.getAllTechnicians();
    console.log('   ✅ All Technicians:', allTechnicians.success ? 'SUCCESS' : 'FAILED');
    if (allTechnicians.success) {
      console.log('   👥 Technicians Found:', allTechnicians.count);
      if (allTechnicians.data.length > 0) {
        console.log('   📄 Sample Technician Fields:', Object.keys(allTechnicians.data[0]));
      }
    }
    console.log('');

    // Test 2: TaskSession Model
    console.log('2️⃣ Testing TaskSession Model...');
    const sessionStats = await TaskSession.getSessionStats();
    console.log('   ✅ Session Stats:', sessionStats.success ? 'SUCCESS' : 'FAILED');
    if (sessionStats.success) {
      console.log('   📊 Total Sessions:', sessionStats.data.totalSessions);
      console.log('   📅 Today Sessions:', sessionStats.data.todaySessions);
      console.log('   📈 Weekly Sessions:', sessionStats.data.weeklySessions);
      console.log('   🔄 Active Sessions:', sessionStats.data.activeSessions);
    }
    console.log('');

    const allSessions = await TaskSession.getAllSessions();
    console.log('   ✅ All Sessions:', allSessions.success ? 'SUCCESS' : 'FAILED');
    if (allSessions.success) {
      console.log('   📋 Sessions Found:', allSessions.count);
      if (allSessions.data.length > 0) {
        console.log('   📄 Sample Session Fields:', Object.keys(allSessions.data[0]));
      }
    }
    console.log('');

    // Test 3: Screen Model
    console.log('3️⃣ Testing Screen Model...');
    const scanStats = await Screen.getScanStats();
    console.log('   ✅ Scan Stats:', scanStats.success ? 'SUCCESS' : 'FAILED');
    if (scanStats.success) {
      console.log('   📊 Total Scans:', scanStats.data.totalScans);
      console.log('   📅 Today Scans:', scanStats.data.todayScans);
      console.log('   📈 Weekly Scans:', scanStats.data.weeklyScans);
      console.log('   📊 Status Breakdown:', scanStats.data.statusBreakdown);
    }
    console.log('');

    const allScans = await Screen.getAllScans();
    console.log('   ✅ All Scans:', allScans.success ? 'SUCCESS' : 'FAILED');
    if (allScans.success) {
      console.log('   📱 Scans Found:', allScans.count);
      if (allScans.data.length > 0) {
        console.log('   📄 Sample Scan Fields:', Object.keys(allScans.data[0]));
      }
    }
    console.log('');

    console.log('🎉 All model tests completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Technicians: ${technicianStats.success ? '✅' : '❌'}`);
    console.log(`   - Sessions: ${sessionStats.success ? '✅' : '❌'}`);
    console.log(`   - Scans: ${scanStats.success ? '✅' : '❌'}`);
    console.log('');
    console.log('✅ Ready to test API endpoints!');

  } catch (error) {
    console.error('❌ Model test failed:', error.message);
  }
}

// Run the test
testModels();
