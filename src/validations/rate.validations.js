const Joi = require('joi');

const currencyCodeSchema = Joi.string()
  .pattern(/^[A-Z]{3}$/)
  .required()
  .messages({
    'string.pattern.base': 'Currency code must be 3 uppercase letters (e.g., USD, EUR, BTC)',
    'any.required': 'Currency code is required'
  });

const rateSchema = Joi.number()
  .positive()
  .required()
  .messages({
    'number.base': 'Rate must be a number',
    'number.positive': 'Rate must be positive',
    'any.required': 'Rate is required'
  });

const sourceSchema = Joi.string()
  .valid('coingecko', 'openexchangerates', 'manual')
  .required()
  .messages({
    'any.only': 'Source must be one of: coingecko, openexchangerates, manual',
    'any.required': 'Source is required'
  });

// Validation for GET /rates
const getRatesSchema = Joi.object({
  fromCurrency: currencyCodeSchema.optional(),
  toCurrency: currencyCodeSchema.optional(),
  source: sourceSchema.optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  skip: Joi.number().integer().min(0).optional()
});

// Validation for POST /rates
const createRateSchema = Joi.object({
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
  rate: rateSchema,
  source: sourceSchema
});

// Validation for PATCH /rates/:id
const updateRateSchema = Joi.object({
  rate: rateSchema.optional(),
  source: sourceSchema.optional(),
  isActive: Joi.boolean().optional()
});

module.exports = {
  getRatesSchema,
  createRateSchema,
  updateRateSchema
}; 