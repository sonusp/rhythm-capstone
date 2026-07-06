import { spawnSync, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const lines = envFile.split('\n');

const envsToPush = [
  'NVIDIA_API_KEY',
  'GROQ_API_KEY',
  'DEEPGRAM_API_KEY',
  'OPENROUTER_API_KEY',
  'VITE_DEEPGRAM_API_KEY',
  'VITE_GOOGLE_CLIENT_ID'
];

const npxCmd = os.platform() === 'win32' ? 'npx.cmd' : 'npx';

for (const line of lines) {
  if (!line || line.trim().startsWith('#') || line.trim().startsWith('VERCEL')) continue;
  
  const match = line.trim().match(/^([^=]+)="?(.*?)"?$/);
  if (match) {
    const key = match[1];
    const value = match[2]; // Unquoted value
    
    if (envsToPush.includes(key)) {
      console.log(`Pushing ${key} to Vercel...`);
      try {
        try {
          execSync(`${npxCmd} vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (e) {}

        const result = spawnSync(npxCmd, ['vercel', 'env', 'add', key, 'production'], {
          input: value,
          encoding: 'utf-8',
          shell: true
        });
        
        if (result.status === 0) {
            console.log(`Successfully pushed ${key}`);
        } else {
            console.error(`Failed to push ${key}:`, result.error ? result.error.message : result.stderr);
        }
      } catch (err) {
        console.error(`Failed to push ${key}: ${err.message}`);
      }
    }
  }
}

console.log('Deploying to Vercel Production...');
try {
  execSync(`${npxCmd} vercel --prod --yes`, { stdio: 'inherit' });
  console.log('Deployment successful!');
} catch (err) {
  console.error('Deployment failed:', err.message);
}
