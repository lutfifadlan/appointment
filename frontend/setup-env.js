#!/usr/bin/env node

// Setup script to create environment variables
import fs from 'fs';
import path from 'path';

const envContent = `# Frontend Application Environment Variables
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BACKEND_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created successfully at:', envPath);
  console.log('📝 Environment variables configured:');
  console.log('   - NEXT_PUBLIC_BASE_URL=http://localhost:3000');
  console.log('   - BACKEND_API_URL=http://localhost:3001');
  console.log('   - NEXT_PUBLIC_WS_URL=http://localhost:3001');
  console.log('');
  console.log('🚀 Please restart your Next.js development server for changes to take effect.');
} catch (error) {
  console.error('❌ Error creating environment file:', error.message);
  console.log('');
  console.log('📝 Please manually create a .env.local file in the frontend directory with the following content:');
  console.log('');
  console.log(envContent);
} 