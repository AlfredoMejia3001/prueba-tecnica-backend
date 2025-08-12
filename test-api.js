const axios = require('axios');

const BASE_URL = 'http://localhost:3007';

async function testAPI() {
  console.log('🧪 Testing Currency Conversion API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test rates endpoint
    console.log('\n2. Testing rates endpoint...');
    const ratesResponse = await axios.get(`${BASE_URL}/rates`);
    console.log('✅ Rates endpoint working:', ratesResponse.data);

    // Test creating a rate
    console.log('\n3. Testing rate creation...');
    const createRateResponse = await axios.post(`${BASE_URL}/rates`, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.85,
      source: 'manual'
    });
    console.log('✅ Rate created:', createRateResponse.data);

    // Test conversion
    console.log('\n4. Testing currency conversion...');
    const conversionResponse = await axios.post(`${BASE_URL}/convert`, {
      from: 'USD',
      to: 'EUR',
      amount: 100
    });
    console.log('✅ Conversion successful:', conversionResponse.data);

    // Test getting conversions
    console.log('\n5. Testing conversion history...');
    const conversionsResponse = await axios.get(`${BASE_URL}/convert`);
    console.log('✅ Conversion history retrieved:', conversionsResponse.data);

    // Test queue status
    console.log('\n6. Testing queue status...');
    const queueResponse = await axios.get(`${BASE_URL}/queue`);
    console.log('✅ Queue status:', queueResponse.data);

    // Test report generation
    console.log('\n7. Testing report generation...');
    const reportResponse = await axios.get(`${BASE_URL}/report`);
    console.log('✅ Report data retrieved:', reportResponse.data);

    console.log('\n🎉 All tests passed! API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI; 