import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config();

async function testCorrectDatabase() {
  console.log('🧪 Testing Correct Database Connection...\n');

  try {
    // Use the correct connection string from the guide
    const uri = 'mongodb+srv://France:FranceMan99@screenscannertechdetail.ac4f8mr.mongodb.net/?retryWrites=true&w=majority&appName=ScreenScannerTechDetails';
    const dbName = 'test'; // The data is stored in the 'test' database

    console.log('1️⃣ Connecting to correct database...');
    console.log('   Database name:', dbName);
    console.log('   URI (first 50 chars):', uri.substring(0, 50) + '...');
    console.log('');

    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    console.log('✅ Successfully connected to database');
    console.log('   Database name:', db.databaseName);
    console.log('');

    // Test 2: List collections
    console.log('2️⃣ Checking collections in test database...');
    const collections = await db.listCollections().toArray();
    console.log('✅ Collections found:', collections.length);
    collections.forEach(col => {
      console.log('   -', col.name);
    });
    console.log('');

    // Test 3: Check each collection for data
    for (const collection of collections) {
      console.log(`3️⃣ Checking ${collection.name} collection...`);
      const col = db.collection(collection.name);
      const count = await col.countDocuments();
      console.log(`   ✅ ${collection.name}: ${count} documents`);
      
      // Show sample document structure
      if (count > 0) {
        const sample = await col.findOne();
        console.log(`   📄 Sample fields:`, Object.keys(sample || {}));
        
        // Show first few documents for users collection
        if (collection.name === 'users' && count > 0) {
          console.log(`   👥 First ${Math.min(3, count)} users:`);
          const users = await col.find().limit(3).toArray();
          users.forEach((user, index) => {
            console.log(`      ${index + 1}. Username: ${user.username || 'N/A'}, Department: ${user.department || 'N/A'}`);
          });
        }
      }
      console.log('');
    }

    // Test 4: Check for technician data specifically
    console.log('4️⃣ Checking for technician data...');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`   ✅ Users collection: ${userCount} technicians`);
    
    if (userCount > 0) {
      const users = await usersCollection.find().toArray();
      console.log('   👥 All technicians:');
      users.forEach((user, index) => {
        console.log(`      ${index + 1}. ID: ${user._id}, Username: ${user.username || 'N/A'}, Department: ${user.department || 'N/A'}, Created: ${user.createdAt || 'N/A'}`);
      });
    }
    console.log('');

    // Test 5: Check for scan data
    console.log('5️⃣ Checking for scan data...');
    const screensCollection = db.collection('screens');
    const screenCount = await screensCollection.countDocuments();
    console.log(`   ✅ Screens collection: ${screenCount} scans`);
    
    if (screenCount > 0) {
      const screens = await screensCollection.find().limit(3).toArray();
      console.log('   📱 Sample scans:');
      screens.forEach((screen, index) => {
        console.log(`      ${index + 1}. Barcode: ${screen.barcode || 'N/A'}, Status: ${screen.status || 'N/A'}, Timestamp: ${screen.timestamp || 'N/A'}`);
      });
    }
    console.log('');

    // Test 6: Check for session data
    console.log('6️⃣ Checking for session data...');
    const sessionsCollection = db.collection('tasksessions');
    const sessionCount = await sessionsCollection.countDocuments();
    console.log(`   ✅ TaskSessions collection: ${sessionCount} sessions`);
    
    if (sessionCount > 0) {
      const sessions = await sessionsCollection.find().limit(3).toArray();
      console.log('   ⏱️ Sample sessions:');
      sessions.forEach((session, index) => {
        console.log(`      ${index + 1}. Technician: ${session.technician || 'N/A'}, Start: ${session.startTime || 'N/A'}, End: ${session.endTime || 'Active'}`);
      });
    }
    console.log('');

    await client.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCorrectDatabase();
