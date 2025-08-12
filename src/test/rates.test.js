const RatesService = require('../services/rates.service');
const Rate = require('../models/rate.model');
const { getRatesSchema, createRateSchema, updateRateSchema } = require('../validations/rate.validations');

describe('Rates Service', () => {
  let ratesService;

  beforeEach(() => {
    ratesService = new RatesService();
  });

  describe('Validation', () => {
    test('should validate valid rate creation data', () => {
      const validData = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        source: 'manual'
      };

      const { error } = createRateSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid currency codes', () => {
      const invalidData = {
        fromCurrency: 'US',
        toCurrency: 'EUR',
        rate: 0.85,
        source: 'manual'
      };

      const { error } = createRateSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Currency code must be 3 uppercase letters');
    });

    test('should reject negative rates', () => {
      const invalidData = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: -0.85,
        source: 'manual'
      };

      const { error } = createRateSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Rate must be positive');
    });

    test('should reject invalid sources', () => {
      const invalidData = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        source: 'invalid'
      };

      const { error } = createRateSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Source must be one of');
    });
  });

  describe('CRUD Operations', () => {
    test('should create a new rate', async () => {
      const rateData = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        source: 'manual'
      };

      const result = await ratesService.create(rateData);
      
      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('EUR');
      expect(result.rate).toBe(0.85);
      expect(result.source).toBe('manual');
      expect(result.isActive).toBe(true);
    });

    test('should update existing rate', async () => {
      // Create initial rate
      const rate = await createTestRate(Rate);
      
      // Update the rate
      const updateData = {
        rate: 0.90,
        source: 'coingecko'
      };

      const result = await ratesService.patch(rate._id.toString(), updateData);
      
      expect(result.rate).toBe(0.90);
      expect(result.source).toBe('coingecko');
    });

    test('should find rates with filters', async () => {
      // Create test rates
      await createTestRate(Rate, { fromCurrency: 'USD', toCurrency: 'EUR' });
      await createTestRate(Rate, { fromCurrency: 'USD', toCurrency: 'GBP' });
      await createTestRate(Rate, { fromCurrency: 'EUR', toCurrency: 'USD' });

      const result = await ratesService.find({
        query: { fromCurrency: 'USD', limit: 10 }
      });

      expect(result.data.length).toBe(2);
      expect(result.data.every(rate => rate.fromCurrency === 'USD')).toBe(true);
    });

    test('should soft delete rate', async () => {
      const rate = await createTestRate(Rate);
      
      const result = await ratesService.remove(rate._id.toString());
      
      expect(result.message).toBe('Rate deactivated successfully');
      
      // Check that rate is marked as inactive
      const updatedRate = await Rate.findById(rate._id);
      expect(updatedRate.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle rate not found', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      await expect(ratesService.get(nonExistentId)).rejects.toThrow('Rate not found');
    });

    test('should handle validation errors in create', async () => {
      const invalidData = {
        fromCurrency: 'INVALID',
        toCurrency: 'EUR',
        rate: -1,
        source: 'invalid'
      };

      await expect(ratesService.create(invalidData)).rejects.toThrow('Validation error');
    });

    test('should handle validation errors in update', async () => {
      const rate = await createTestRate(Rate);
      
      const invalidData = {
        rate: -1,
        source: 'invalid'
      };

      await expect(ratesService.patch(rate._id.toString(), invalidData)).rejects.toThrow('Validation error');
    });
  });

  describe('Query Parameters', () => {
    test('should validate query parameters', () => {
      const validQuery = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        source: 'manual',
        limit: 50,
        skip: 0
      };

      const { error } = getRatesSchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    test('should reject invalid query parameters', () => {
      const invalidQuery = {
        fromCurrency: 'INVALID',
        limit: -1,
        skip: -1
      };

      const { error } = getRatesSchema.validate(invalidQuery);
      expect(error).toBeDefined();
    });
  });
}); 