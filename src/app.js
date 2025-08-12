const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const CronJobs = require('./utils/cron');
const CSVImportService = require('./services/csv-import.service');
require('dotenv').config();

const RatesService = require('./services/rates.service');
const ConvertService = require('./services/convert.service');
const ReportService = require('./services/report.service');
const QueueService = require('./services/queue.service');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io available to services
app.io = io;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Cliente WebSocket conectado:', socket.id);
  
  // Join a room for real-time updates
  socket.join('conversions');
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente WebSocket desconectado:', socket.id);
  });
  
  socket.on('join-conversions', () => {
    socket.join('conversions');
    console.log('👥 Cliente se unió al room de conversiones');
  });
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('MongoDB not available, running in demo mode');
  console.log('To enable full functionality, install and start MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error (continuing in demo mode):', err.message);
});

const rates = new RatesService();
const convert = new ConvertService();
const report = new ReportService();
const queue = new QueueService();
const csvImport = new CSVImportService();

// Pass app instance to services for WebSocket access
rates.app = app;
convert.app = app;
report.app = app;
queue.app = app;

// Initialize cron jobs
const cronJobs = new CronJobs(app);
// Pass services to cron jobs
cronJobs.ratesService = rates;
cronJobs.reportService = report;
cronJobs.startAllJobs();
console.log('⏰ Cron jobs iniciados');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Test endpoints
app.get('/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

app.post('/test-convert', (req, res) => {
  try {
    const { from, to, amount } = req.body;
    const rate = 0.85; // Demo rate
    const convertedAmount = amount * rate;
    
    res.json({
      fromCurrency: from,
      toCurrency: to,
      originalAmount: amount,
      convertedAmount: convertedAmount,
      rate: rate,
      rateSource: 'demo'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rates endpoints
app.get('/rates', async (req, res) => {
  try {
    const result = await rates.find(req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/rates', async (req, res) => {
  try {
    const result = await rates.create(req.body, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/rates/:id', async (req, res) => {
  try {
    const result = await rates.patch(req.params.id, req.body, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/rates/:id', async (req, res) => {
  try {
    const result = await rates.remove(req.params.id, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Convert endpoints
app.get('/convert', async (req, res) => {
  try {
    const result = await convert.find(req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/convert', async (req, res) => {
  try {
    const result = await convert.create(req.body, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/convert/:id', async (req, res) => {
  try {
    const result = await convert.get(req.params.id, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/convert/:id', async (req, res) => {
  try {
    const result = await convert.remove(req.params.id, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Report endpoints
app.get('/report', async (req, res) => {
  try {
    const result = await report.find(req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/report', async (req, res) => {
  try {
    const result = await report.create(req.body, req);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
    res.send(result.buffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Queue endpoints
app.get('/queue', async (req, res) => {
  try {
    const result = await queue.find(req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/queue', async (req, res) => {
  try {
    const result = await queue.create(req.body, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cron job endpoints
app.post('/cron/update-rates', async (req, res) => {
  try {
    const result = await cronJobs.manualRateUpdate();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/cron/status', (req, res) => {
  const status = cronJobs.getJobStatus();
  res.json(status);
});

// CSV Import endpoints
app.get('/csv/template', async (req, res) => {
  try {
    const template = await csvImport.getCSVTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rates-template.csv"');
    res.send(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/csv/import', csvImport.getUploadMiddleware(), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo CSV' });
    }

    const result = await csvImport.importFromCSV(req.file.path);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/csv/validate', csvImport.getUploadMiddleware(), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo CSV' });
    }

    const result = await csvImport.validateCSV(req.file.path);
    
    // Clean up file after validation
    const fs = require('fs');
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = process.env.PORT || 3007;

server.listen(port, () => {
  console.log(`Currency Conversion API running on port ${port}`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${port}`);
  console.log(`⏰ Cron jobs activos - Actualización cada hora`);
  console.log(`📊 CSV Import disponible - /csv/template, /csv/import, /csv/validate`);
});

module.exports = app;