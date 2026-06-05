import { getCaktoToken, caktoFetch } from '../lib/cakto';

async function testCakto() {
  console.log('--- Cakto API Diagnostic ---');
  try {
    console.log('1. Attempting to get auth token...');
    const token = await getCaktoToken();
    console.log('✅ Auth token retrieved successfully.');

    console.log('2. Attempting to fetch products...');
    const products = await caktoFetch('/public_api/products/');
    console.log(`✅ Successfully fetched ${products.results?.length || 0} products.`);
    
    console.log('--- Diagnostic Complete: Cakto is WORKING ✅ ---');
  } catch (error: any) {
    console.error('❌ Cakto Diagnostic Failed:');
    console.error(error.message);
    console.log('\nTroubleshooting steps:');
    console.log('- Check if CAKTO_CLIENT_ID and CAKTO_CLIENT_SECRET are correct in .env.local');
    console.log('- Ensure Cakto API is enabled in their dashboard');
  }
}

testCakto();
