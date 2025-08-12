const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  fromCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  toCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  convertedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  rateSource: {
    type: String,
    required: true,
    enum: ['coingecko', 'openexchangerates', 'manual', 'external', 'demo']
  },
  conversionDate: {
    type: Date,
    default: Date.now
  },
  userIp: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries by date range
conversionSchema.index({ conversionDate: -1 });

// Index for currency pair queries
conversionSchema.index({ fromCurrency: 1, toCurrency: 1 });

// Index for daily reports
conversionSchema.index({ 
  conversionDate: 1,
  fromCurrency: 1,
  toCurrency: 1 
});

const Conversion = mongoose.model('Conversion', conversionSchema);

module.exports = Conversion; 