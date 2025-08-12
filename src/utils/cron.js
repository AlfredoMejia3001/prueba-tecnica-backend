const cron = require('node-cron');
const externalAPIs = require('./external-apis');

class CronJobs {
  constructor(app) {
    this.app = app;
    this.jobs = new Map();
    this.ratesService = null;
    this.reportService = null;
  }

  // Start all cron jobs
  startAllJobs() {
    this.startRateUpdateJob();
    this.startDailyReportJob();
    console.log('⏰ Todos los cron jobs iniciados');
  }

  // Update rates every hour
  startRateUpdateJob() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        console.log('🔄 Iniciando actualización programada de tasas...');
        
        // Get rates service from app context
        if (!this.ratesService) {
          this.ratesService = this.app.rates || new (require('../services/rates.service'))();
        }
        
        const result = await this.ratesService.updateRatesFromExternalAPIs();
        
        console.log('✅ Actualización programada de tasas completada exitosamente');
        console.log('📊 Resultado:', result);
      } catch (error) {
        console.error('❌ Error en actualización programada de tasas:', error.message);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.jobs.set('rateUpdate', job);
    console.log('⏰ Cron job de actualización de tasas iniciado (cada hora)');
  }

  // Generate daily report at midnight
  startDailyReportJob() {
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('📄 Iniciando generación programada de reporte diario...');
        
        // Get report service from app context
        if (!this.reportService) {
          this.reportService = this.app.report || new (require('../services/report.service'))();
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];
        
        const reportData = await this.reportService.find({ query: { date: dateString } });
        
        if (reportData.statistics.totalConversions > 0) {
          const pdfBuffer = await this.reportService.generatePDF(reportData);
          
          // Here you could save the PDF to a file or send it via email
          console.log(`📄 Reporte diario generado para ${dateString} con ${reportData.statistics.totalConversions} conversiones`);
        } else {
          console.log(`📄 No se encontraron conversiones para ${dateString}, omitiendo generación de reporte`);
        }
        
        console.log('✅ Generación programada de reporte diario completada');
      } catch (error) {
        console.error('❌ Error en generación programada de reporte diario:', error.message);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.jobs.set('dailyReport', job);
    console.log('⏰ Cron job de reporte diario iniciado (diario a medianoche)');
  }

  // Manual rate update (can be called via API)
  async manualRateUpdate() {
    try {
      console.log('🔄 Iniciando actualización manual de tasas...');
      
      // Get rates service from app context
      if (!this.ratesService) {
        this.ratesService = this.app.rates || new (require('../services/rates.service'))();
      }
      
      const result = await this.ratesService.updateRatesFromExternalAPIs();
      
      console.log('✅ Actualización manual de tasas completada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error en actualización manual de tasas:', error.message);
      throw error;
    }
  }

  // Stop all jobs
  stopAllJobs() {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`⏹️ Cron job ${name} detenido`);
    }
    this.jobs.clear();
  }

  // Stop a specific job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`⏹️ Cron job ${jobName} detenido`);
    } else {
      throw new Error(`Cron job ${jobName} no encontrado`);
    }
  }

  // Start a specific job
  startJob(jobName) {
    switch (jobName) {
      case 'rateUpdate':
        this.startRateUpdateJob();
        break;
      case 'dailyReport':
        this.startDailyReportJob();
        break;
      default:
        throw new Error(`Cron job desconocido: ${jobName}`);
    }
  }

  // Get job status
  getJobStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        nextRun: job.nextDate ? job.nextDate().toISOString() : null
      };
    }
    return status;
  }

  // Get all jobs
  getAllJobs() {
    return Array.from(this.jobs.keys());
  }
}

module.exports = CronJobs; 