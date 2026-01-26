import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const ENV_FILES = ['.env.production', '.env', '.env.development'];

export const loadEnv = ({ envDir, requiredKeys = [] } = {}) => {
  const baseDir = envDir ? path.resolve(envDir) : process.cwd();
  const tried = [];
  const errors = [];
  let loaded = null;

  for (const filename of ENV_FILES) {
    const fullPath = path.join(baseDir, filename);
    tried.push(fullPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const result = dotenv.config({ path: fullPath, override: false });
    if (result.error) {
      errors.push({ file: fullPath, message: result.error.message });
      continue;
    }

    loaded = fullPath;
    const missing = requiredKeys.filter((key) => !process.env[key]);
    if (missing.length === 0) {
      break;
    }
  }

  const missingRequiredKeys = requiredKeys.filter((key) => !process.env[key]);
  return { loaded, tried, errors, missingRequiredKeys };
};
