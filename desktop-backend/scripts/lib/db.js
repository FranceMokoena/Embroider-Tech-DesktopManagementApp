import { MongoClient } from 'mongodb';
import { loadEnv } from './envLoader.js';

const DEFAULT_DB_NAME = 'EmbronderiesDB';

export const resolveDbNameFromUri = (uri) => {
  if (!uri) return DEFAULT_DB_NAME;
  try {
    const withoutParams = uri.split('?')[0];
    const name = withoutParams.substring(withoutParams.lastIndexOf('/') + 1);
    return name || DEFAULT_DB_NAME;
  } catch {
    return DEFAULT_DB_NAME;
  }
};

export const connectDb = async ({ envDir, quiet } = {}) => {
  const envInfo = loadEnv({ envDir, requiredKeys: ['MONGO_URI'] });
  if (!quiet && envInfo.loaded) {
    console.log(`Loaded environment from ${envInfo.loaded}`);
  }
  if (!quiet && envInfo.errors.length) {
    console.warn('Some env files failed to load:', envInfo.errors);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing. Check your .env files or environment variables.');
  }

  const dbName = process.env.MONGO_DB_NAME || resolveDbNameFromUri(uri);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  return { client, db, dbName, envInfo };
};

export const closeDb = async (client) => {
  if (client) {
    await client.close();
  }
};
