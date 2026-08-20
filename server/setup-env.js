import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('Created .env file from .env.example');
  console.log('Please add your SARVAM_API_KEY to the .env file');
} else if (fs.existsSync(envPath)) {
  console.log('.env file already exists');
} else {
  console.log('.env.example not found');
}
