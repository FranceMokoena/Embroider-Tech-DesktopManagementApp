import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables from the correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

console.log('🔍 Debug Environment Variables...\n');

// Check if .env file exists
console.log('1️⃣ Checking .env file:');
console.log('   Path:', envPath);
console.log('   Exists:', fs.existsSync(envPath));
console.log('');

// Read .env file content
if (fs.existsSync(envPath)) {
  console.log('2️⃣ .env file content:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(envContent);
  console.log('');
}

// Load environment variables
console.log('3️⃣ Loading environment variables...');
dotenv.config({ path: envPath });

// Check environment variables
console.log('4️⃣ Environment variables check:');
console.log('   MOBILE_DB_URI:', process.env.MOBILE_DB_URI ? 'EXISTS' : 'MISSING');
console.log('   MOBILE_DB_NAME:', process.env.MOBILE_DB_NAME ? 'EXISTS' : 'MISSING');
console.log('   MOBILE_API_URL:', process.env.MOBILE_API_URL ? 'EXISTS' : 'MISSING');
console.log('');

// Show actual values (masked for security)
if (process.env.MOBILE_DB_URI) {
  console.log('5️⃣ MOBILE_DB_URI value (first 50 chars):', process.env.MOBILE_DB_URI.substring(0, 50) + '...');
}
if (process.env.MOBILE_DB_NAME) {
  console.log('   MOBILE_DB_NAME value:', process.env.MOBILE_DB_NAME);
}
console.log('');
