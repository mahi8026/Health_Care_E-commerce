const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Connection state tracking
let reconnectionAttempts = 0;
let isReconnecting = false;

// Exponential backoff reconnection function
const attemptReconnection = () => {
  if (isReconnecting) return;
  
  isReconnecting = true;
  reconnectionAttempts++;
  
  // Calculate delay: Math.min(2^attempt * 1000, 30000)
  const delay = Math.min(Math.pow(2, reconnectionAttempts) * 1000, 30000);
  
  logger.warn(`MongoDB reconnection attempt ${reconnectionAttempts} in ${delay}ms...`);
  
  setTimeout(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
      });
      logger.info('MongoDB reconnection successful');
      reconnectionAttempts = 0;
      isReconnecting = false;
    } catch (error) {
      logger.error(`MongoDB reconnection attempt ${reconnectionAttempts} failed: ${error.message}`);
      isReconnecting = false;
      attemptReconnection();
    }
  }, delay);
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });

    logger.info(`✓ MongoDB Connected: ${conn.connection.host}`);
    
    // Reset reconnection attempts on successful initial connection
    reconnectionAttempts = 0;
    
    // Run data synchronization after successful connection
    try {
      const { syncData } = require('../services/dataSync');
      await syncData();
    } catch (syncError) {
      logger.error(`Data sync error: ${syncError.message}`);
      // Don't exit - allow server to continue
    }
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
      reconnectionAttempts = 0;
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected - attempting reconnection...');
      attemptReconnection();
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
      reconnectionAttempts = 0;
      isReconnecting = false;
    });
    
    mongoose.connection.on('error', (error) => {
      logger.error(`MongoDB connection error: ${error.message}`);
      // Do not exit process for post-connection errors
    });
    
  } catch (error) {
    logger.error(`✗ MongoDB Connection Error: ${error.message}`);
    // Only exit on initial connection failure
    process.exit(1);
  }
};

module.exports = connectDB;
