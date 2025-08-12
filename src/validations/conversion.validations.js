const Joi = require('joi');

const currencyCodeSchema = Joi.string()
  .pattern(/^[A-Z]{3}$/)
  .required()
  .messages({
    'string.pattern.base': 'Currency code must be 3 uppercase letters (e.g., USD, EUR, BTC)',
    'any.required': 'Currency code is required'
  });

const amountSchema = Joi.number()
  .positive()
  .precision(2)
  .required()
  .messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'number.precision': 'Amount can have up to 2 decimal places',
    'any.required': 'Amount is required'
  });

// Validation for POST /convert
const convertSchema = Joi.object({
  from: currencyCodeSchema,
  to: currencyCodeSchema,
  amount: amountSchema
});

// Validation for GET /convert (for historical conversions)
const getConversionsSchema = Joi.object({
  fromCurrency: currencyCodeSchema.optional(),
  toCurrency: currencyCodeSchema.optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  skip: Joi.number().integer().min(0).optional()
});

module.exports = {
  convertSchema,
  getConversionsSchema
}; 