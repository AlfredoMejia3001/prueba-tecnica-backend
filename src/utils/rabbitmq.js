const amqp = require('amqplib');

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = process.env.RABBITMQ_QUEUE || 'conversion_logs';
    this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Ensure queue exists
      await this.channel.assertQueue(this.queueName, {
        durable: true // Queue survives broker restart
      });

      console.log('Connected to RabbitMQ');
      return true;
    } catch (error) {
      console.error('RabbitMQ connection error:', error.message);
      return false;
    }
  }

  async sendMessage(message) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const sent = this.channel.sendToQueue(this.queueName, messageBuffer, {
        persistent: true // Message survives broker restart
      });

      if (sent) {
        console.log('Message sent to RabbitMQ queue');
        return true;
      } else {
        console.error('Failed to send message to RabbitMQ queue');
        return false;
      }
    } catch (error) {
      console.error('Error sending message to RabbitMQ:', error.message);
      return false;
    }
  }

  async sendConversionLog(conversionData) {
    const message = {
      type: 'conversion',
      timestamp: new Date().toISOString(),
      data: conversionData
    };

    return await this.sendMessage(message);
  }

  async sendRateUpdateLog(rateData) {
    const message = {
      type: 'rate_update',
      timestamp: new Date().toISOString(),
      data: rateData
    };

    return await this.sendMessage(message);
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error.message);
    }
  }

  // Graceful shutdown
  async gracefulShutdown() {
    console.log('Shutting down RabbitMQ connection...');
    await this.close();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  const rabbitmq = new RabbitMQ();
  await rabbitmq.gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const rabbitmq = new RabbitMQ();
  await rabbitmq.gracefulShutdown();
  process.exit(0);
});

module.exports = RabbitMQ; 