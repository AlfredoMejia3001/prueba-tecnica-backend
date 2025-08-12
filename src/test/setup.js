// Test setup file for Jest
const mongoose = require('mongoose');

// Mock external APIs for testing
jest.mock('../utils/external-apis', () => ({
  getCryptoRates: jest.fn(),
  getFiatRates: jest.fn(),
  getAllCryptoRates: jest.fn(),
  getAllFiatRates: jest.fn(),
  getRate: jest.fn(),
  isCryptoCurrency: jest.fn()
}));

// Mock RabbitMQ for testing
jest.mock('../utils/rabbitmq', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(true),
    sendMessage: jest.fn().mockResolvedValue(true),
    sendConversionLog: jest.fn().mockResolvedValue(true),
    sendRateUpdateLog: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true)
  }));
});

// Global test timeout
jest.setTimeout(10000);

// Setup and teardown
beforeAll(async () => {
  // Connect to test database
  const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/currency_conversion_test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  // Cleanup and disconnect
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Helper function to create test data
global.createTestRate = async (Rate, data = {}) => {
  const defaultData = {
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    rate: 0.85,
    source: 'manual',
    isActive: true
  };
  
  const rate = new Rate({ ...defaultData, ...data });
  return await rate.save();
};

global.createTestConversion = async (Conversion, data = {}) => {
  const defaultData = {
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    originalAmount: 100,
    convertedAmount: 85,
    rate: 0.85,
    rateSource: 'manual'
  };
  
  const conversion = new Conversion({ ...defaultData, ...data });
  return await conversion.save();
}; 