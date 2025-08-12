const ConvertService = require('../services/convert.service');
const Conversion = require('../models/conversion.model');
const Rate = require('../models/rate.model');
const { convertSchema, getConversionsSchema } = require('../validations/conversion.validations');

describe('Convert Service', () => {
  let convertService;

  beforeEach(() => {
    convertService = new ConvertService();
  });

  describe('Validation', () => {
    test('should validate valid conversion data', () => {
      const validData = {
        from: 'USD',
        to: 'EUR',
        amount: 100.50
      };

      const { error } = convertSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid currency codes', () => {
      const invalidData = {
        from: 'US',
        to: 'EUR',
        amount: 100
      };

      const { error } = convertSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Currency code must be 3 uppercase letters');
    });

    test('should reject negative amounts', () => {
      const invalidData = {
        from: 'USD',
        to: 'EUR',
        amount: -100
      };

      const { error } = convertSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Amount must be positive');
    });

    test('should reject zero amounts', () => {
      const invalidData = {
        from: 'USD',
        to: 'EUR',
        amount: 0
      };

      const { error } = convertSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Amount must be positive');
    });

    test('should validate query parameters for historical conversions', () => {
      const validQuery = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 50,
        skip: 0
      };

      const { error } = getConversionsSchema.validate(validQuery);
      expect(error).toBeUndefined();
    });
  });

  describe('Conversion Logic', () => {
    beforeEach(async () => {
      // Mock the rates service
      convertService.app = {
        service: jest.fn().mockReturnValue({
          getRateForPair: jest.fn().mockResolvedValue({
            rate: 0.85,
            source: 'manual'
          })
        })
      };
    });

    test('should perform currency conversion', async () => {
      const conversionData = {
        from: 'USD',
        to: 'EUR',
        amount: 100
      };

      const result = await convertService.create(conversionData, {
        headers: {
          'user-agent': 'test-agent',
          'x-forwarded-for': '127.0.0.1'
        }
      });

      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('EUR');
      expect(result.originalAmount).toBe(100);
      expect(result.convertedAmount).toBe(85);
      expect(result.rate).toBe(0.85);
      expect(result.rateSource).toBe('manual');
    });

    test('should store conversion in database', async () => {
      const conversionData = {
        from: 'USD',
        to: 'EUR',
        amount: 100
      };

      await convertService.create(conversionData);

      const conversions = await Conversion.find({});
      expect(conversions).toHaveLength(1);
      
      const conversion = conversions[0];
      expect(conversion.fromCurrency).toBe('USD');
      expect(conversion.toCurrency).toBe('EUR');
      expect(conversion.originalAmount).toBe(100);
      expect(conversion.convertedAmount).toBe(85);
    });

    test('should handle decimal amounts correctly', async () => {
      const conversionData = {
        from: 'USD',
        to: 'EUR',
        amount: 100.75
      };

      const result = await convertService.create(conversionData);

      expect(result.originalAmount).toBe(100.75);
      expect(result.convertedAmount).toBe(85.64); // 100.75 * 0.85 = 85.6375, rounded to 2 decimals
    });
  });

  describe('Historical Data', () => {
    beforeEach(async () => {
      // Create test conversions
      await createTestConversion(Conversion, {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        originalAmount: 100,
        convertedAmount: 85,
        conversionDate: new Date('2024-01-01')
      });

      await createTestConversion(Conversion, {
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        originalAmount: 200,
        convertedAmount: 150,
        conversionDate: new Date('2024-01-02')
      });

      await createTestConversion(Conversion, {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        originalAmount: 50,
        convertedAmount: 60,
        conversionDate: new Date('2024-01-03')
      });
    });

    test('should find conversions with filters', async () => {
      const result = await convertService.find({
        query: { fromCurrency: 'USD', limit: 10 }
      });

      expect(result.data.length).toBe(2);
      expect(result.data.every(conv => conv.fromCurrency === 'USD')).toBe(true);
    });

    test('should find conversions by date range', async () => {
      const result = await convertService.find({
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-02'
        }
      });

      expect(result.data.length).toBe(2);
    });

    test('should get conversion statistics', async () => {
      const stats = await convertService.getConversionStats({
        query: { fromCurrency: 'USD' }
      });

      expect(stats.totalConversions).toBe(2);
      expect(stats.totalOriginalAmount).toBe(300); // 100 + 200
      expect(stats.totalConvertedAmount).toBe(235); // 85 + 150
    });

    test('should get popular currency pairs', async () => {
      const popularPairs = await convertService.getPopularPairs({
        query: { limit: 5 }
      });

      expect(popularPairs.length).toBeGreaterThan(0);
      expect(popularPairs[0]).toHaveProperty('fromCurrency');
      expect(popularPairs[0]).toHaveProperty('toCurrency');
      expect(popularPairs[0]).toHaveProperty('conversionCount');
      expect(popularPairs[0]).toHaveProperty('totalAmount');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing rate', async () => {
      convertService.app = {
        service: jest.fn().mockReturnValue({
          getRateForPair: jest.fn().mockResolvedValue(null)
        })
      };

      const conversionData = {
        from: 'USD',
        to: 'INVALID',
        amount: 100
      };

      await expect(convertService.create(conversionData)).rejects.toThrow('Rate not available');
    });

    test('should handle validation errors', async () => {
      const invalidData = {
        from: 'INVALID',
        to: 'EUR',
        amount: -100
      };

      await expect(convertService.create(invalidData)).rejects.toThrow('Validation error');
    });

    test('should handle conversion not found', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      await expect(convertService.get(nonExistentId)).rejects.toThrow('Conversion not found');
    });
  });

  describe('CRUD Operations', () => {
    test('should get conversion by ID', async () => {
      const conversion = await createTestConversion(Conversion);
      
      const result = await convertService.get(conversion._id.toString());
      
      expect(result._id.toString()).toBe(conversion._id.toString());
      expect(result.fromCurrency).toBe(conversion.fromCurrency);
      expect(result.toCurrency).toBe(conversion.toCurrency);
    });

    test('should delete conversion', async () => {
      const conversion = await createTestConversion(Conversion);
      
      const result = await convertService.remove(conversion._id.toString());
      
      expect(result.message).toBe('Conversion deleted successfully');
      
      // Verify deletion
      const deletedConversion = await Conversion.findById(conversion._id);
      expect(deletedConversion).toBeNull();
    });

    test('should reject PATCH operations', async () => {
      const conversion = await createTestConversion(Conversion);
      
      await expect(convertService.patch(conversion._id.toString(), {})).rejects.toThrow('PATCH method not allowed');
    });
  });
}); 