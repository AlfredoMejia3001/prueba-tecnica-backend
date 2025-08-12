const mongoose = require('mongoose');
const Conversion = require('../models/conversion.model');
const { convertSchema, getConversionsSchema } = require('../validations/conversion.validations');
const externalAPIs = require('../utils/external-apis');
const RabbitMQ = require('../utils/rabbitmq');

class ConvertService {
  constructor(options = {}) {
    this.rabbitmq = new RabbitMQ();
  }

  async find(params) {
    try {
      // Validate query parameters
      const { error, value } = getConversionsSchema.validate(params.query || {});
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const { fromCurrency, toCurrency, startDate, endDate, limit = 50, skip = 0 } = value;
      
      // Build query
      const query = {};
      if (fromCurrency) query.fromCurrency = fromCurrency.toUpperCase();
      if (toCurrency) query.toCurrency = toCurrency.toUpperCase();
      
      // Date range filter
      if (startDate || endDate) {
        query.conversionDate = {};
        if (startDate) query.conversionDate.$gte = new Date(startDate);
        if (endDate) query.conversionDate.$lte = new Date(endDate);
      }

      const conversions = await Conversion.find(query)
        .sort({ conversionDate: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      return {
        data: conversions,
        total: conversions.length,
        limit: parseInt(limit),
        skip: parseInt(skip)
      };
    } catch (error) {
      throw new Error(`Error fetching conversions: ${error.message}`);
    }
  }

  async get(id, params) {
    try {
      const conversion = await Conversion.findById(id);
      if (!conversion) {
        throw new Error('Conversion not found');
      }
      return conversion;
    } catch (error) {
      throw new Error(`Error fetching conversion: ${error.message}`);
    }
  }

  async create(data, params) {
    try {
      // Validate input data
      const { error, value } = convertSchema.validate(data);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const { from, to, amount } = value;

      // Get rate for the currency pair (simplified for demo)
      let rate = { rate: 0.85, source: 'demo' };
      
      // Try to get from external API if available
      try {
        const externalRate = await externalAPIs.getRate(from, to);
        if (externalRate) {
          rate = { rate: externalRate, source: 'external' };
        }
      } catch (error) {
        console.log('Using demo rate for conversion');
      }
      
      if (!rate) {
        throw new Error(`Rate not available for ${from} to ${to}`);
      }

      // Calculate conversion
      const convertedAmount = parseFloat((amount * rate.rate).toFixed(2));
      const originalAmount = parseFloat(amount);

      // Create conversion record (only if MongoDB is available)
      let conversion = null;
      if (mongoose.connection.readyState === 1) {
        conversion = new Conversion({
          fromCurrency: from.toUpperCase(),
          toCurrency: to.toUpperCase(),
          originalAmount,
          convertedAmount,
          rate: rate.rate,
          rateSource: rate.source,
          userIp: params.headers?.['x-forwarded-for'] || params.headers?.['x-real-ip'] || 'unknown',
          userAgent: params.headers?.['user-agent'] || 'unknown'
        });

        await conversion.save();
      }

      // Send to RabbitMQ if conversion was saved
      if (conversion) {
        await this.rabbitmq.sendConversionLog({
          id: conversion._id,
          fromCurrency: conversion.fromCurrency,
          toCurrency: conversion.toCurrency,
          originalAmount: conversion.originalAmount,
          convertedAmount: conversion.convertedAmount,
          rate: conversion.rate,
          rateSource: conversion.rateSource,
          conversionDate: conversion.conversionDate
        });
      }

      // Emit WebSocket event for real-time updates
      if (this.app && this.app.io) {
        const wsEvent = {
          id: conversion?._id || 'demo',
          fromCurrency: conversion?.fromCurrency || from.toUpperCase(),
          toCurrency: conversion?.toCurrency || to.toUpperCase(),
          originalAmount: conversion?.originalAmount || originalAmount,
          convertedAmount: conversion?.convertedAmount || convertedAmount,
          rate: conversion?.rate || rate.rate,
          rateSource: conversion?.rateSource || rate.source,
          timestamp: conversion?.conversionDate || new Date(),
          userIp: conversion?.userIp || 'unknown'
        };
        
        this.app.io.to('conversions').emit('conversion', wsEvent);
        console.log('📡 Evento WebSocket emitido:', wsEvent.fromCurrency, '->', wsEvent.toCurrency);
      }

      return {
        fromCurrency: conversion?.fromCurrency || from.toUpperCase(),
        toCurrency: conversion?.toCurrency || to.toUpperCase(),
        originalAmount: conversion?.originalAmount || originalAmount,
        convertedAmount: conversion?.convertedAmount || convertedAmount,
        rate: conversion?.rate || rate.rate,
        rateSource: conversion?.rateSource || rate.source,
        conversionDate: conversion?.conversionDate || new Date()
      };
    } catch (error) {
      throw new Error(`Error performing conversion: ${error.message}`);
    }
  }

  async patch(id, data, params) {
    throw new Error('PATCH method not allowed for conversions');
  }

  async remove(id, params) {
    try {
      const conversion = await Conversion.findById(id);
      if (!conversion) {
        throw new Error('Conversion not found');
      }

      await Conversion.findByIdAndDelete(id);

      return { message: 'Conversion deleted successfully' };
    } catch (error) {
      throw new Error(`Error removing conversion: ${error.message}`);
    }
  }

  // Custom method to get conversion statistics
  async getConversionStats(params) {
    try {
      const { fromCurrency, toCurrency, startDate, endDate } = params.query || {};
      
      const matchStage = {};
      if (fromCurrency) matchStage.fromCurrency = fromCurrency.toUpperCase();
      if (toCurrency) matchStage.toCurrency = toCurrency.toUpperCase();
      if (startDate || endDate) {
        matchStage.conversionDate = {};
        if (startDate) matchStage.conversionDate.$gte = new Date(startDate);
        if (endDate) matchStage.conversionDate.$lte = new Date(endDate);
      }

      const stats = await Conversion.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalConversions: { $sum: 1 },
            totalOriginalAmount: { $sum: '$originalAmount' },
            totalConvertedAmount: { $sum: '$convertedAmount' },
            averageRate: { $avg: '$rate' },
            minRate: { $min: '$rate' },
            maxRate: { $max: '$rate' }
          }
        }
      ]);

      return stats[0] || {
        totalConversions: 0,
        totalOriginalAmount: 0,
        totalConvertedAmount: 0,
        averageRate: 0,
        minRate: 0,
        maxRate: 0
      };
    } catch (error) {
      throw new Error(`Error getting conversion stats: ${error.message}`);
    }
  }

  // Custom method to get popular currency pairs
  async getPopularPairs(params) {
    try {
      const { limit = 10 } = params.query || {};

      const popularPairs = await Conversion.aggregate([
        {
          $group: {
            _id: {
              fromCurrency: '$fromCurrency',
              toCurrency: '$toCurrency'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$originalAmount' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]);

      return popularPairs.map(pair => ({
        fromCurrency: pair._id.fromCurrency,
        toCurrency: pair._id.toCurrency,
        conversionCount: pair.count,
        totalAmount: pair.totalAmount
      }));
    } catch (error) {
      throw new Error(`Error getting popular pairs: ${error.message}`);
    }
  }
}

module.exports = ConvertService; 