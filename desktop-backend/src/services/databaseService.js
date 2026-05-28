import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    const uri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME || 'test';

    if (!uri) {
      throw new Error('Database connection configuration missing');
    }

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db(dbName);
    this.isConnected = true;

    console.log(`Connected to RFID ERP database: ${dbName}`);
    return this.db;
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
      console.log('Database connection closed');
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
