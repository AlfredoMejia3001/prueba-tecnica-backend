const PdfPrinter = require('pdfmake');
const Conversion = require('../models/conversion.model');
const Rate = require('../models/rate.model');

class ReportService {
  constructor(options = {}) {
    this.fonts = {
      Roboto: {
        normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
        bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
        italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
        bolditalics: 'node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf'
      }
    };
    this.printer = new PdfPrinter(this.fonts);
  }

  async find(params) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = params.query || {};
      
      // Get conversions for the specified date (using local timezone)
      const startDate = new Date(date + 'T00:00:00.000Z');
      const endDate = new Date(date + 'T23:59:59.999Z');
      
      console.log(`🔍 Buscando conversiones entre: ${startDate.toISOString()} y ${endDate.toISOString()}`);

      const conversions = await Conversion.find({
        conversionDate: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ conversionDate: -1 });

      console.log(`📊 Encontradas ${conversions.length} conversiones`);

      // Get conversion statistics
      const stats = await Conversion.aggregate([
        {
          $match: {
            conversionDate: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalConversions: { $sum: 1 },
            totalOriginalAmount: { $sum: '$originalAmount' },
            totalConvertedAmount: { $sum: '$convertedAmount' },
            averageRate: { $avg: '$rate' },
            uniqueCurrencyPairs: { $addToSet: { from: '$fromCurrency', to: '$toCurrency' } }
          }
        }
      ]);

      // Get popular currency pairs
      const popularPairs = await Conversion.aggregate([
        {
          $match: {
            conversionDate: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
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
        { $limit: 5 }
      ]);

      return {
        date,
        conversions: conversions.length,
        statistics: stats[0] || {
          totalConversions: 0,
          totalOriginalAmount: 0,
          totalConvertedAmount: 0,
          averageRate: 0,
          uniqueCurrencyPairs: []
        },
        popularPairs: popularPairs.map(pair => ({
          fromCurrency: pair._id.fromCurrency,
          toCurrency: pair._id.toCurrency,
          conversionCount: pair.count,
          totalAmount: pair.totalAmount
        }))
      };
    } catch (error) {
      // If MongoDB error, return demo data
      if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED')) {
        return {
          date: params.query?.date || new Date().toISOString().split('T')[0],
          conversions: 0,
          statistics: {
            totalConversions: 0,
            totalOriginalAmount: 0,
            totalConvertedAmount: 0,
            averageRate: 0,
            uniqueCurrencyPairs: []
          },
          popularPairs: []
        };
      }
      throw new Error(`Error generating report: ${error.message}`);
    }
  }

  async get(id, params) {
    throw new Error('GET method not supported for reports');
  }

  async create(data, params) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = data;
      
      // Get report data
      const reportData = await this.find({ query: { date } });
      
      // Generate PDF
      const pdfBuffer = await this.generatePDF(reportData);
      
      return {
        message: 'PDF report generated successfully',
        date: reportData.date,
        filename: `conversion_report_${date}.pdf`,
        buffer: pdfBuffer
      };
    } catch (error) {
      throw new Error(`Error creating report: ${error.message}`);
    }
  }

  async patch(id, data, params) {
    throw new Error('PATCH method not supported for reports');
  }

  async remove(id, params) {
    throw new Error('REMOVE method not supported for reports');
  }

  async generatePDF(reportData) {
    try {
      const { date, conversions, statistics, popularPairs } = reportData;

      const docDefinition = {
        content: [
          // Header
          {
            text: 'Currency Conversion Daily Report',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          
          // Date
          {
            text: `Date: ${new Date(date).toLocaleDateString()}`,
            style: 'subheader',
            margin: [0, 0, 0, 20]
          },

          // Summary Statistics
          {
            text: 'Summary Statistics',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                ['Metric', 'Value'],
                ['Total Conversions', statistics.totalConversions.toString()],
                ['Total Original Amount', `$${statistics.totalOriginalAmount.toFixed(2)}`],
                ['Total Converted Amount', `$${statistics.totalConvertedAmount.toFixed(2)}`],
                ['Average Rate', statistics.averageRate.toFixed(4)],
                ['Unique Currency Pairs', statistics.uniqueCurrencyPairs.length.toString()]
              ]
            },
            margin: [0, 0, 0, 20]
          },

          // Popular Currency Pairs
          {
            text: 'Most Popular Currency Pairs',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [
                ['From', 'To', 'Conversions', 'Total Amount'],
                ...popularPairs.map(pair => [
                  pair.fromCurrency,
                  pair.toCurrency,
                  pair.conversionCount.toString(),
                  `$${pair.totalAmount.toFixed(2)}`
                ])
              ]
            },
            margin: [0, 0, 0, 20]
          },

          // Demo mode notice if no data
          ...(statistics.totalConversions === 0 ? [{
            text: 'Note: This is a demo report. No conversion data available.',
            style: 'demoNotice',
            alignment: 'center',
            margin: [0, 20, 0, 0]
          }] : []),

          // Footer
          {
            text: `Report generated on ${new Date().toLocaleString()}`,
            style: 'footer',
            alignment: 'center',
            margin: [0, 30, 0, 0]
          }
        ],
        styles: {
          header: {
            fontSize: 24,
            bold: true,
            color: '#2c3e50'
          },
          subheader: {
            fontSize: 16,
            bold: true,
            color: '#34495e'
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            color: '#7f8c8d',
            margin: [0, 10, 0, 5]
          },
          footer: {
            fontSize: 10,
            color: '#95a5a6'
          },
          demoNotice: {
            fontSize: 12,
            color: '#e74c3c',
            italics: true
          }
        },
        defaultStyle: {
          fontSize: 12
        }
      };

      return new Promise((resolve, reject) => {
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
        const chunks = [];

        pdfDoc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        pdfDoc.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });

        pdfDoc.on('error', (error) => {
          reject(error);
        });

        pdfDoc.end();
      });
    } catch (error) {
      throw new Error(`Error generating PDF: ${error.message}`);
    }
  }

  // Custom method to generate monthly report
  async generateMonthlyReport(params) {
    try {
      const { year, month } = params.query || {};
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || currentDate.getMonth() + 1;

      // Check if MongoDB is connected
      if (!Conversion.db || !Conversion.db.db) {
        return {
          year: targetYear,
          month: targetMonth,
          monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long' }),
          dailyStats: [],
          topPairs: []
        };
      }

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

      // Get monthly statistics
      const monthlyStats = await Conversion.aggregate([
        {
          $match: {
            conversionDate: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$conversionDate' },
              month: { $month: '$conversionDate' },
              day: { $dayOfMonth: '$conversionDate' }
            },
            dailyConversions: { $sum: 1 },
            dailyAmount: { $sum: '$originalAmount' }
          }
        },
        { $sort: { '_id.day': 1 } }
      ]);

      // Get top currency pairs for the month
      const topPairs = await Conversion.aggregate([
        {
          $match: {
            conversionDate: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
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
        { $limit: 10 }
      ]);

      return {
        year: targetYear,
        month: targetMonth,
        monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long' }),
        dailyStats: monthlyStats,
        topPairs: topPairs.map(pair => ({
          fromCurrency: pair._id.fromCurrency,
          toCurrency: pair._id.toCurrency,
          conversionCount: pair.count,
          totalAmount: pair.totalAmount
        }))
      };
    } catch (error) {
      // If MongoDB error, return demo data
      if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED')) {
        const currentDate = new Date();
        const targetYear = params.query?.year || currentDate.getFullYear();
        const targetMonth = params.query?.month || currentDate.getMonth() + 1;
        
        return {
          year: targetYear,
          month: targetMonth,
          monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long' }),
          dailyStats: [],
          topPairs: []
        };
      }
      throw new Error(`Error generating monthly report: ${error.message}`);
    }
  }
}

module.exports = ReportService; 