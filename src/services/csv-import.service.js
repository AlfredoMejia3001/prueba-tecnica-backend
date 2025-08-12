const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Rate = require('../models/rate.model');

class CSVImportService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDir();
    this.setupMulter();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  setupMulter() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
      }
    });

    this.upload = multer({
      storage: this.storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos CSV'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
      }
    });
  }

  getUploadMiddleware() {
    return this.upload.single('csvFile');
  }

  async importFromCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          try {
            // Validate and process row
            const processedRow = this.processRow(row, rowNumber);
            if (processedRow) {
              results.push(processedRow);
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              error: error.message,
              data: row
            });
          }
        })
        .on('end', async () => {
          try {
            // Save valid rates to database
            const savedRates = await this.saveRates(results);
            
            // Clean up file
            fs.unlinkSync(filePath);
            
            resolve({
              success: true,
              totalRows: rowNumber,
              processedRows: results.length,
              savedRates: savedRates.length,
              errors: errors,
              summary: {
                total: rowNumber,
                processed: results.length,
                saved: savedRates.length,
                errors: errors.length
              }
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  processRow(row, rowNumber) {
    // Expected CSV format: fromCurrency,toCurrency,rate,source
    const { fromCurrency, toCurrency, rate, source } = row;

    // Validate required fields
    if (!fromCurrency || !toCurrency || !rate) {
      throw new Error(`Fila ${rowNumber}: Campos requeridos faltantes (fromCurrency, toCurrency, rate)`);
    }

    // Validate currency codes (3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(fromCurrency.toUpperCase())) {
      throw new Error(`Fila ${rowNumber}: Código de moneda origen inválido: ${fromCurrency}`);
    }

    if (!/^[A-Z]{3}$/.test(toCurrency.toUpperCase())) {
      throw new Error(`Fila ${rowNumber}: Código de moneda destino inválido: ${toCurrency}`);
    }

    // Validate rate (positive number)
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      throw new Error(`Fila ${rowNumber}: Tasa inválida: ${rate}`);
    }

    // Validate source (optional, default to 'manual')
    const validSources = ['coingecko', 'openexchangerates', 'manual'];
    const sourceValue = source ? source.toLowerCase() : 'manual';
    if (!validSources.includes(sourceValue)) {
      throw new Error(`Fila ${rowNumber}: Fuente inválida: ${source}. Debe ser: ${validSources.join(', ')}`);
    }

    return {
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      rate: rateValue,
      source: sourceValue
    };
  }

  async saveRates(rates) {
    const savedRates = [];
    
    for (const rateData of rates) {
      try {
        // Check if rate already exists
        const existingRate = await Rate.findOne({
          fromCurrency: rateData.fromCurrency,
          toCurrency: rateData.toCurrency
        });

        if (existingRate) {
          // Update existing rate
          existingRate.rate = rateData.rate;
          existingRate.source = rateData.source;
          existingRate.lastUpdated = new Date();
          await existingRate.save();
          savedRates.push(existingRate);
        } else {
          // Create new rate
          const newRate = new Rate(rateData);
          await newRate.save();
          savedRates.push(newRate);
        }
      } catch (error) {
        console.error(`Error saving rate ${rateData.fromCurrency}->${rateData.toCurrency}:`, error.message);
      }
    }

    return savedRates;
  }

  async getCSVTemplate() {
    const template = `fromCurrency,toCurrency,rate,source
USD,EUR,0.85,manual
EUR,USD,1.18,manual
USD,MXN,18.50,manual
BTC,USD,45000,coingecko
ETH,USD,3000,coingecko
EUR,JPY,160.50,openexchangerates
USD,JPY,150.25,openexchangerates`;
    
    return template;
  }

  async validateCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          try {
            const processedRow = this.processRow(row, rowNumber);
            if (processedRow) {
              results.push(processedRow);
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              error: error.message,
              data: row
            });
          }
        })
        .on('end', () => {
          resolve({
            valid: errors.length === 0,
            totalRows: rowNumber,
            validRows: results.length,
            errors: errors
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}

module.exports = CSVImportService; 