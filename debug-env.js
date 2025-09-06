const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('=== Environment Variables Debug ===');
console.log('Working Directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('ENV file path:', path.join(__dirname, '.env'));

// Read .env file directly
const fs = require('fs');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log('\n=== .env file content ===');
  console.log(envContent.split('\n').slice(0, 10).join('\n')); // First 10 lines
} catch (error) {
  console.log('Error reading .env file:', error.message);
}

console.log('\n=== Process Environment ===');
console.log('ASTRA_DB_ID:', process.env.ASTRA_DB_ID);
console.log('ASTRA_DB_REGION:', process.env.ASTRA_DB_REGION);
console.log('ASTRA_DB_API_ENDPOINT:', process.env.ASTRA_DB_API_ENDPOINT);
console.log('ASTRA_DB_APPLICATION_TOKEN exists:', !!process.env.ASTRA_DB_APPLICATION_TOKEN);
console.log('ASTRA_DB_KEYSPACE:', process.env.ASTRA_DB_KEYSPACE);
