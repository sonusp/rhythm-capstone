const { execSync } = require('child_process');

console.log('Deploying to Vercel...');
try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit' });
} catch (err) {
  console.error(`Deployment failed: ${err.message}`);
}
