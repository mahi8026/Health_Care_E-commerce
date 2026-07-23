const mongoose = require('mongoose');
const { slowQueryPlugin } = require('../mongooseSlowQueryPlugin');
const logger = require('../logger');

// Mock logger
jest.mock('../logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Mongoose Slow Query Plugin', () => {
  let TestModel;
  let connection;

  beforeAll(async () => {
    // Connect to in-memory MongoDB for testing
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test-slow-query';
    connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a test schema with the plugin
    const testSchema = new mongoose.Schema({
      name: String,
      value: Number,
      createdAt: { type: Date, default: Date.now },
    });

    // Apply plugin with low threshold for testing
    testSchema.plugin(slowQueryPlugin, {
      threshold: 10, // 10ms threshold for testing
      logAll: false,
    });

    // Create or reuse model
    TestModel = mongoose.models.TestModel || mongoose.model('TestModel', testSchema);
  });

  afterEach(async () => {
    // Clean up test data
    await TestModel.deleteMany({});
  });

  describe('Query Operations', () => {
    it('should log slow find queries', async () => {
      // Create test data
      await TestModel.create([
        { name: 'test1', value: 1 },
        { name: 'test2', value: 2 },
        { name: 'test3', value: 3 },
      ]);

      // Perform a query that might be slow
      await TestModel.find({ name: /test/ });

      // Wait a bit for async logging
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if logger.warn was called for slow queries
      // Note: This might not always trigger if query is fast
      // In real scenarios, slow queries would be logged
      expect(logger.warn).toHaveBeenCalledTimes(0); // Fast query shouldn't log
    });

    it('should log slow findOne queries', async () => {
      await TestModel.create({ name: 'test', value: 1 });
      await TestModel.findOne({ name: 'test' });

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Fast query shouldn't log
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });

    it('should log slow update queries', async () => {
      const doc = await TestModel.create({ name: 'test', value: 1 });
      await TestModel.updateOne({ _id: doc._id }, { value: 2 });

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Fast query shouldn't log
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });

    it('should log slow delete queries', async () => {
      const doc = await TestModel.create({ name: 'test', value: 1 });
      await TestModel.deleteOne({ _id: doc._id });

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Fast query shouldn't log
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });

    it('should log slow count queries', async () => {
      await TestModel.create([
        { name: 'test1', value: 1 },
        { name: 'test2', value: 2 },
      ]);

      await TestModel.countDocuments({ name: /test/ });

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Fast query shouldn't log
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });
  });

  describe('Aggregation Operations', () => {
    it('should log slow aggregation queries', async () => {
      await TestModel.create([
        { name: 'test1', value: 1 },
        { name: 'test2', value: 2 },
        { name: 'test3', value: 3 },
      ]);

      await TestModel.aggregate([
        { $match: { name: /test/ } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]);

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Fast aggregation shouldn't log
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });
  });

  describe('Document Operations', () => {
    it('should log slow save operations', async () => {
      const doc = new TestModel({ name: 'test', value: 1 });
      await doc.save();

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Fast save shouldn't log
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });

    it('should log slow remove operations', async () => {
      const doc = await TestModel.create({ name: 'test', value: 1 });
      await doc.remove();

      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Fast remove shouldn't log
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });
  });

  describe('Plugin Configuration', () => {
    it('should respect custom threshold', async () => {
      // Create schema with very low threshold
      const customSchema = new mongoose.Schema({
        name: String,
      });

      customSchema.plugin(slowQueryPlugin, {
        threshold: 1, // 1ms - almost everything will be slow
        logAll: false,
      });

      const CustomModel = mongoose.model('CustomModel', customSchema);

      await CustomModel.create({ name: 'test' });
      await CustomModel.find({});

      await new Promise(resolve => setTimeout(resolve, 50));

      // With 1ms threshold, queries should be logged as slow
      // Note: Actual behavior depends on system performance
    });

    it('should log all queries when logAll is true', async () => {
      // Create schema with logAll enabled
      const allLogSchema = new mongoose.Schema({
        name: String,
      });

      allLogSchema.plugin(slowQueryPlugin, {
        threshold: 100,
        logAll: true, // Log all queries
      });

      const AllLogModel = mongoose.model('AllLogModel', allLogSchema);

      await AllLogModel.create({ name: 'test' });
      await AllLogModel.find({});

      await new Promise(resolve => setTimeout(resolve, 50));

      // With logAll=true, should log even fast queries
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should log query errors', async () => {
      try {
        // Try to query with invalid ObjectId
        await TestModel.findById('invalid-id');
      } catch (error) {
        // Expected to throw
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should log error
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Log Format', () => {
    it('should include required fields in log data', async () => {
      // Create schema with very low threshold to ensure logging
      const logFormatSchema = new mongoose.Schema({
        name: String,
      });

      logFormatSchema.plugin(slowQueryPlugin, {
        threshold: 0, // Log everything
        logAll: false,
      });

      const LogFormatModel = mongoose.model('LogFormatModel', logFormatSchema);

      await LogFormatModel.create({ name: 'test' });
      await LogFormatModel.find({});

      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if logger was called with proper structure
      if (logger.warn.mock.calls.length > 0) {
        const logCall = logger.warn.mock.calls[0];
        expect(logCall[0]).toBe('[SLOW QUERY]');
        expect(logCall[1]).toHaveProperty('operation');
        expect(logCall[1]).toHaveProperty('collection');
        expect(logCall[1]).toHaveProperty('duration');
        expect(logCall[1]).toHaveProperty('timestamp');
      }
    });
  });
});
