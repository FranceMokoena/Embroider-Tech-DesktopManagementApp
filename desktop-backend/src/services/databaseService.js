import { MongoClient } from 'mongodb';
import '../config/env.js';

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Use the correct connection string and database name from the guide
      const uri =
        process.env.MONGO_URI ||
        'mongodb+srv://France:FranceMan99@screenscannertechdetail.ac4f8mr.mongodb.net/?retryWrites=true&w=majority&appName=ScreenScannerTechDetails';
      const defaultDbName = (() => {
        try {
          const withoutParams = uri.split('?')[0];
          return withoutParams.substring(withoutParams.lastIndexOf('/') + 1) || 'EmbronderiesDB';
        } catch {
          return 'EmbronderiesDB';
        }
      })();
      const dbName = process.env.MONGO_DB_NAME || defaultDbName;

      console.log('🔍 Checking environment variables...');
      console.log('URI exists:', !!uri);
      console.log('DB Name:', dbName);

      if (!uri) {
        throw new Error('Database connection configuration missing');
      }

      console.log('🔌 Connecting to mobile app database...');

      this.client = new MongoClient(uri);
      await this.client.connect();
      
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log('✅ Successfully connected to mobile app database');
      console.log('   Database name:', dbName);
      return this.db;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async getDb() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.db;
  }

  async getCollection(collectionName) {
    const db = await this.getDb();
    return db.collection(collectionName);
  }

  async testConnection() {
    try {
      const db = await this.getDb();
      await db.admin().ping();
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
