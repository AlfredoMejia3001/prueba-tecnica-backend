const mongoose = require('mongoose');
const Rate = require('../models/rate.model');
const { getRatesSchema, createRateSchema, updateRateSchema } = require('../validations/rate.validations');
const externalAPIs = require('../utils/external-apis');
const RabbitMQ = require('../utils/rabbitmq');

class RatesService {
  constructor(options = {}) {
    this.rabbitmq = new RabbitMQ();
  }

  async find(params) {
    try {
      // Validate query parameters
      const { error, value } = getRatesSchema.validate(params.query || {});
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const { fromCurrency, toCurrency, source, limit = 50, skip = 0 } = value;
      
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        return {
          data: [],
          total: 0,
          limit: parseInt(limit),
          skip: parseInt(skip),
          message: "MongoDB not connected - using demo data"
        };
      }
      
      // Build query
      const query = { isActive: true };
      if (fromCurrency) query.fromCurrency = fromCurrency.toUpperCase();
      if (toCurrency) query.toCurrency = toCurrency.toUpperCase();
      if (source) query.source = source;

      const rates = await Rate.find(query)
        .sort({ lastUpdated: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      return {
        data: rates,
        total: rates.length,
        limit: parseInt(limit),
        skip: parseInt(skip)
      };
    } catch (error) {
      throw new Error(`Error fetching rates: ${error.message}`);
    }
  }

  async get(id, params) {
    try {
      const rate = await Rate.findById(id);
      if (!rate) {
        throw new Error('Rate not found');
      }
      return rate;
    } catch (error) {
      throw new Error(`Error fetching rate: ${error.message}`);
    }
  }

  async create(data, params) {
    try {
      // Validate input data
      const { error, value } = createRateSchema.validate(data);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const { fromCurrency, toCurrency, rate, source } = value;

      // Check if rate already exists
      const existingRate = await Rate.findOne({
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase()
      });

      if (existingRate) {
        // Update existing rate
        existingRate.rate = rate;
        existingRate.source = source;
        existingRate.lastUpdated = new Date();
        await existingRate.save();

        // Send to RabbitMQ
        await this.rabbitmq.sendRateUpdateLog({
          action: 'update',
          fromCurrency: existingRate.fromCurrency,
          toCurrency: existingRate.toCurrency,
          rate: existingRate.rate,
          source: existingRate.source
        });

        return existingRate;
      } else {
        // Create new rate
        const newRate = new Rate({
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          rate,
          source
        });

        await newRate.save();

        // Send to RabbitMQ
        await this.rabbitmq.sendRateUpdateLog({
          action: 'create',
          fromCurrency: newRate.fromCurrency,
          toCurrency: newRate.toCurrency,
          rate: newRate.rate,
          source: newRate.source
        });

        return newRate;
      }
    } catch (error) {
      throw new Error(`Error creating rate: ${error.message}`);
    }
  }

  async patch(id, data, params) {
    try {
      // Validate input data
      const { error, value } = updateRateSchema.validate(data);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const rate = await Rate.findById(id);
      if (!rate) {
        throw new Error('Rate not found');
      }

      // Update fields
      if (value.rate !== undefined) rate.rate = value.rate;
      if (value.source !== undefined) rate.source = value.source;
      if (value.isActive !== undefined) rate.isActive = value.isActive;
      
      rate.lastUpdated = new Date();
      await rate.save();

      // Send to RabbitMQ
      await this.rabbitmq.sendRateUpdateLog({
        action: 'update',
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: rate.rate,
        source: rate.source
      });

      return rate;
    } catch (error) {
      throw new Error(`Error updating rate: ${error.message}`);
    }
  }

  async remove(id, params) {
    try {
      const rate = await Rate.findById(id);
      if (!rate) {
        throw new Error('Rate not found');
      }

      // Soft delete
      rate.isActive = false;
      await rate.save();

      // Send to RabbitMQ
      await this.rabbitmq.sendRateUpdateLog({
        action: 'delete',
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: rate.rate,
        source: rate.source
      });

      return { message: 'Rate deactivated successfully' };
    } catch (error) {
      throw new Error(`Error removing rate: ${error.message}`);
    }
  }

  // Custom method to update rates from external APIs
  async updateRatesFromExternalAPIs() {
    try {
      console.log('Updating rates from external APIs...');

      // Get crypto rates
      const cryptoRates = await externalAPIs.getAllCryptoRates();
      for (const [pair, rate] of Object.entries(cryptoRates)) {
        const [fromCurrency, toCurrency] = pair.split('_');
        await this.create({
          fromCurrency,
          toCurrency,
          rate,
          source: 'coingecko'
        });
      }

      // Get FIAT rates
      const fiatRates = await externalAPIs.getAllFiatRates();
      for (const [pair, rate] of Object.entries(fiatRates)) {
        const [fromCurrency, toCurrency] = pair.split('_');
        await this.create({
          fromCurrency,
          toCurrency,
          rate,
          source: 'openexchangerates'
        });
      }

      console.log('Rates updated successfully from external APIs');
      return { message: 'Rates updated successfully' };
    } catch (error) {
      console.error('Error updating rates from external APIs:', error.message);
      throw new Error(`Error updating rates: ${error.message}`);
    }
  }

  // Custom method to get rate for specific currency pair
  async getRateForPair(fromCurrency, toCurrency) {
    try {
      // First try to get from database
      let rate = await Rate.findOne({
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        isActive: true
      });

      if (!rate) {
        // If not in database, try to get from external API
        const externalRate = await externalAPIs.getRate(fromCurrency, toCurrency);
        
        if (externalRate) {
          // Save to database
          rate = await this.create({
            fromCurrency,
            toCurrency,
            rate: externalRate,
            source: externalAPIs.isCryptoCurrency(fromCurrency) ? 'coingecko' : 'openexchangerates'
          });
        } else {
          throw new Error(`Rate not available for ${fromCurrency} to ${toCurrency}`);
        }
      }

      return rate;
    } catch (error) {
      throw new Error(`Error getting rate: ${error.message}`);
    }
  }
}

module.exports = RatesService; 