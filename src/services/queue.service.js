const RabbitMQ = require('../utils/rabbitmq');

class QueueService {
  constructor(options = {}) {
    this.rabbitmq = new RabbitMQ();
  }

  async find(params) {
    try {
      // Get queue status
      const queueStatus = await this.getQueueStatus();
      
      return {
        queueName: this.rabbitmq.queueName,
        status: queueStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error getting queue status: ${error.message}`);
    }
  }

  async get(id, params) {
    throw new Error('GET method not supported for queue service');
  }

  async create(data, params) {
    try {
      const { message, type = 'custom' } = data;
      
      if (!message) {
        throw new Error('Message is required');
      }

      const queueMessage = {
        type,
        timestamp: new Date().toISOString(),
        data: message
      };

      const sent = await this.rabbitmq.sendMessage(queueMessage);
      
      if (sent) {
        return {
          message: 'Message sent to queue successfully',
          type,
          timestamp: queueMessage.timestamp
        };
      } else {
        throw new Error('Failed to send message to queue');
      }
    } catch (error) {
      throw new Error(`Error sending message to queue: ${error.message}`);
    }
  }

  async patch(id, data, params) {
    throw new Error('PATCH method not supported for queue service');
  }

  async remove(id, params) {
    throw new Error('REMOVE method not supported for queue service');
  }

  async getQueueStatus() {
    try {
      if (!this.rabbitmq.channel) {
        await this.rabbitmq.connect();
      }

      const queueInfo = await this.rabbitmq.channel.checkQueue(this.rabbitmq.queueName);
      
      return {
        connected: true,
        queueName: queueInfo.queue,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Custom method to get queue statistics
  async getQueueStats(params) {
    try {
      const status = await this.getQueueStatus();
      
      if (!status.connected) {
        throw new Error('Not connected to RabbitMQ');
      }

      return {
        queueName: status.queueName,
        messageCount: status.messageCount,
        consumerCount: status.consumerCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error getting queue stats: ${error.message}`);
    }
  }

  // Custom method to purge queue
  async purgeQueue(params) {
    try {
      if (!this.rabbitmq.channel) {
        await this.rabbitmq.connect();
      }

      const purgeResult = await this.rabbitmq.channel.purgeQueue(this.rabbitmq.queueName);
      
      return {
        message: 'Queue purged successfully',
        purgedCount: purgeResult.messageCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error purging queue: ${error.message}`);
    }
  }

  // Custom method to test queue connection
  async testConnection(params) {
    try {
      const connected = await this.rabbitmq.connect();
      
      if (connected) {
        return {
          message: 'Queue connection test successful',
          connected: true,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Failed to connect to RabbitMQ');
      }
    } catch (error) {
      return {
        message: 'Queue connection test failed',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = QueueService; 