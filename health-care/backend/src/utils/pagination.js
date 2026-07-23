/**
 * Pagination Utility
 * 
 * Provides standardized pagination helper for all list endpoints.
 * Implements consistent pagination format with metadata and response streaming support.
 */

const { PAGINATION } = require('../config/constants');
const { Transform } = require('stream');

/**
 * Generate pagination metadata
 * 
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata object
 */
function generatePaginationMetadata(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Paginate a Mongoose query and return standardized response
 * 
 * @param {Object} query - Mongoose query object (before .exec())
 * @param {number} page - Page number from request (default: 1)
 * @param {number} limit - Items per page from request (default: 20)
 * @param {number} total - Total count (pass if already calculated, otherwise will be counted)
 * @returns {Promise<Object>} Paginated response with data and pagination metadata
 * 
 * @example
 * const result = await paginateResponse(
 *   Product.find({ isActive: true }).populate('category'),
 *   req.query.page,
 *   req.query.limit,
 *   totalCount
 * );
 * res.json(result);
 */
async function paginateResponse(query, page = 1, limit = 20, total = null) {
  // Normalize and validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || PAGINATION.DEFAULT_PAGE);
  const limitNum = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT)
  );
  
  // Calculate skip
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query with pagination
  const data = await query
    .skip(skip)
    .limit(limitNum)
    .lean();
  
  // Get total count if not provided
  if (total === null) {
    // Extract the model from the query
    const model = query.model;
    const conditions = query.getQuery();
    total = await model.countDocuments(conditions);
  }
  
  // Generate pagination metadata
  const pagination = generatePaginationMetadata(pageNum, limitNum, total);
  
  return {
    success: true,
    data,
    pagination
  };
}

/**
 * Create a JSON streaming transform for large datasets
 * Streams array items one by one to reduce memory usage
 * 
 * @returns {Transform} Transform stream that converts objects to JSON array format
 * 
 * @example
 * const stream = createStreamingTransform();
 * res.setHeader('Content-Type', 'application/json');
 * cursor.pipe(stream).pipe(res);
 */
function createStreamingTransform() {
  let isFirst = true;
  
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const prefix = isFirst ? '{"success":true,"data":[' : ',';
        isFirst = false;
        
        const json = JSON.stringify(chunk);
        this.push(prefix + json);
        callback();
      } catch (error) {
        callback(error);
      }
    },
    flush(callback) {
      // Close the JSON array and object
      this.push('],"streaming":true}');
      callback();
    }
  });
}

/**
 * Stream paginated results for very large datasets
 * Uses MongoDB cursor to stream results without loading all into memory
 * 
 * @param {Object} query - Mongoose query object
 * @param {Object} res - Express response object
 * @param {Object} options - Streaming options
 * @param {number} options.batchSize - Number of documents to fetch per batch (default: 100)
 * 
 * @example
 * await streamPaginatedResponse(
 *   Product.find({ isActive: true }),
 *   res,
 *   { batchSize: 100 }
 * );
 */
async function streamPaginatedResponse(query, res, options = {}) {
  const { batchSize = 100 } = options;
  
  try {
    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Create cursor for streaming
    const cursor = query.cursor({ batchSize });
    
    // Create transform stream
    const transform = createStreamingTransform();
    
    // Pipe cursor through transform to response
    cursor.pipe(transform).pipe(res);
    
    // Handle errors
    cursor.on('error', (error) => {
      console.error('Streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Streaming error' });
      }
    });
    
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream results' });
    }
  }
}

/**
 * Parse and validate pagination parameters from request query
 * 
 * @param {Object} query - Express request query object
 * @returns {Object} Validated pagination parameters { page, limit }
 * 
 * @example
 * const { page, limit } = parsePaginationParams(req.query);
 */
function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  
  // Parse limit, handling 0 and invalid values
  const parsedLimit = parseInt(query.limit);
  const limitValue = isNaN(parsedLimit) ? PAGINATION.DEFAULT_LIMIT : parsedLimit;
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, limitValue)
  );
  
  return { page, limit };
}

module.exports = {
  paginateResponse,
  generatePaginationMetadata,
  streamPaginatedResponse,
  createStreamingTransform,
  parsePaginationParams
};
