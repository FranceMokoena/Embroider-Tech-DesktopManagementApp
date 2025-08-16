import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from the correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

console.log('🔍 Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Debug: Check if environment variables are loaded
console.log('🔍 Environment variables check:');
console.log('MOBILE_DB_URI exists:', !!process.env.MOBILE_DB_URI);
console.log('MOBILE_DB_NAME exists:', !!process.env.MOBILE_DB_NAME);

import databaseService from './src/services/databaseService.js';

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection...\n');

  try {
    // Test 1: Connect to database
    console.log('1️⃣ Testing database connection...');
    const db = await databaseService.connect();
    console.log('✅ Database connection successful');
    console.log('   Database name:', db.databaseName);
    console.log('');

    // Test 2: List collections
    console.log('2️⃣ Testing collection access...');
    const collections = await db.listCollections().toArray();
    console.log('✅ Collections found:', collections.length);
    collections.forEach(col => {
      console.log('   -', col.name);
    });
    console.log('');

    // Test 3: Test each collection
    for (const collection of collections) {
      console.log(`3️⃣ Testing ${collection.name} collection...`);
      const col = db.collection(collection.name);
      const count = await col.countDocuments();
      console.log(`   ✅ ${collection.name}: ${count} documents`);
      
      // Show sample document structure
      if (count > 0) {
        const sample = await col.findOne();
        console.log(`   📄 Sample fields:`, Object.keys(sample || {}));
      }
      console.log('');
    }

    // Test 4: Test specific queries
    console.log('4️⃣ Testing specific data queries...');
    
    // Test Users collection
    const usersCollection = await databaseService.getCollection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`   ✅ Users: ${userCount} technicians`);
    
    // Test TaskSessions collection
    const sessionsCollection = await databaseService.getCollection('tasksessions');
    const sessionCount = await sessionsCollection.countDocuments();
    console.log(`   ✅ TaskSessions: ${sessionCount} sessions`);
    
    // Test Screens collection
    const screensCollection = await databaseService.getCollection('screens');
    const screenCount = await screensCollection.countDocuments();
    console.log(`   ✅ Screens: ${screenCount} scans`);
    console.log('');

    console.log('🎉 Database connection test completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Sessions: ${sessionCount}`);
    console.log(`   - Scans: ${screenCount}`);
    console.log('');
    console.log('✅ Ready to implement data models and queries!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check MongoDB connection string in .env');
    console.log('   2. Verify network access to MongoDB Atlas');
    console.log('   3. Check database credentials');
  } finally {
    // Close connection
    await databaseService.close();
  }
}

// Run the test
testDatabaseConnection();
