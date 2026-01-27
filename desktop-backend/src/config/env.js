import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const mode = process.env.NODE_ENV || 'development';
const envFilesByMode = {
  production: ['.env.production', '.env'],
  development: ['.env.development', '.env'],
  test: ['.env.test', '.env']
};

const candidates = envFilesByMode[mode] || [`.env.${mode}`, '.env'];

candidates.forEach((filename) => {
  const fullPath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
});
