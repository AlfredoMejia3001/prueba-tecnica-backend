const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
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
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    required: true,
    enum: ['coingecko', 'openexchangerates', 'manual']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
rateSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

// Index for source and lastUpdated for efficient updates
rateSchema.index({ source: 1, lastUpdated: 1 });

const Rate = mongoose.model('Rate', rateSchema);

module.exports = Rate; 