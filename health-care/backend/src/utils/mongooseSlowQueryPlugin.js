const logger = require('./logger');

/**
 * Mongoose plugin to log slow queries
 * Logs queries that exceed the specified threshold
 * 
 * @param {Object} schema - Mongoose schema
 * @param {Object} options - Plugin options
 * @param {number} options.threshold - Threshold in milliseconds (default: 100ms)
 * @param {boolean} options.logAll - Log all queries regardless of duration (default: false)
 */
function slowQueryPlugin(schema, options = {}) {
  const threshold = options.threshold || 100; // Default 100ms
  const logAll = options.logAll || false;

  // Hook into all query operations
  const queryMethods = [
    'count',
    'countDocuments',
    'deleteMany',
    'deleteOne',
    'distinct',
    'estimatedDocumentCount',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndReplace',
    'findOneAndUpdate',
    'remove',
    'replaceOne',
    'update',
    'updateMany',
    'updateOne'
  ];

  // Hook into aggregate operations
  schema.pre('aggregate', function(next) {
    this._startTime = Date.now();
    next();
  });

  schema.post('aggregate', function(result) {
    const duration = Date.now() - this._startTime;
    const pipeline = this.pipeline();
    
    if (logAll || duration > threshold) {
      const logData = {
        operation: 'aggregate',
        collection: this._model?.collection?.name || 'unknown',
        pipeline: JSON.stringify(pipeline),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        slow: duration > threshold
      };

      if (duration > threshold) {
        logger.warn('[SLOW QUERY]', logData);
      } else if (logAll) {
        logger.info('[QUERY]', logData);
      }
    }
  });

  // Hook into all query methods
  queryMethods.forEach(method => {
    // Pre hook to capture start time
    schema.pre(method, function(next) {
      this._startTime = Date.now();
      next();
    });

    // Post hook to log slow queries
    schema.post(method, function(result) {
      const duration = Date.now() - this._startTime;
      
      if (logAll || duration > threshold) {
        const query = this.getQuery ? this.getQuery() : this._conditions || {};
        const update = this.getUpdate ? this.getUpdate() : {};
        const options = this.getOptions ? this.getOptions() : {};
        
        const logData = {
          operation: method,
          collection: this.mongooseCollection?.name || this.model?.collection?.name || 'unknown',
          query: JSON.stringify(query),
          update: Object.keys(update).length > 0 ? JSON.stringify(update) : undefined,
          options: Object.keys(options).length > 0 ? JSON.stringify(options) : undefined,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
          slow: duration > threshold,
          resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
        };

        // Remove undefined fields
        Object.keys(logData).forEach(key => {
          if (logData[key] === undefined) {
            delete logData[key];
          }
        });

        if (duration > threshold) {
          logger.warn('[SLOW QUERY]', logData);
        } else if (logAll) {
          logger.info('[QUERY]', logData);
        }
      }
    });

    // Error hook to log failed queries
    schema.post(method, function(error, doc, next) {
      if (error) {
        const duration = Date.now() - (this._startTime || Date.now());
        const query = this.getQuery ? this.getQuery() : this._conditions || {};
        
        logger.error('[QUERY ERROR]', {
          operation: method,
          collection: this.mongooseCollection?.name || this.model?.collection?.name || 'unknown',
          query: JSON.stringify(query),
          duration: `${duration}ms`,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    });
  });

  // Hook into save operations
  schema.pre('save', function(next) {
    this._startTime = Date.now();
    next();
  });

  schema.post('save', function(doc) {
    const duration = Date.now() - this._startTime;
    
    if (logAll || duration > threshold) {
      const logData = {
        operation: 'save',
        collection: this.constructor.collection.name,
        documentId: this._id?.toString(),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        slow: duration > threshold,
        isNew: this.isNew
      };

      if (duration > threshold) {
        logger.warn('[SLOW QUERY]', logData);
      } else if (logAll) {
        logger.info('[QUERY]', logData);
      }
    }
  });

  // Hook into remove operations
  schema.pre('remove', function(next) {
    this._startTime = Date.now();
    next();
  });

  schema.post('remove', function(doc) {
    const duration = Date.now() - this._startTime;
    
    if (logAll || duration > threshold) {
      const logData = {
        operation: 'remove',
        collection: this.constructor.collection.name,
        documentId: this._id?.toString(),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        slow: duration > threshold
      };

      if (duration > threshold) {
        logger.warn('[SLOW QUERY]', logData);
      } else if (logAll) {
        logger.info('[QUERY]', logData);
      }
    }
  });
}

/**
 * Helper function to format query data for logging
 * Truncates large objects to prevent log bloat
 */
function formatQueryData(data, maxLength = 500) {
  const str = JSON.stringify(data);
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '... [truncated]';
  }
  return str;
}

/**
 * Get query statistics from logs
 * This can be called periodically to analyze slow queries
 */
function getSlowQueryStats() {
  // This would require integration with a log aggregation system
  // For now, it's a placeholder for future implementation
  return {
    message: 'Query statistics require log aggregation system integration',
    recommendation: 'Use Winston transports to send logs to aggregation service'
  };
}

module.exports = {
  slowQueryPlugin,
  formatQueryData,
  getSlowQueryStats
};
