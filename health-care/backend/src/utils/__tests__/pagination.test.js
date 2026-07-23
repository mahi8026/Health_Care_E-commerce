/**
 * Tests for pagination utility
 */

const {
  generatePaginationMetadata,
  parsePaginationParams,
  paginateResponse
} = require('../pagination');

describe('Pagination Utility', () => {
  describe('generatePaginationMetadata', () => {
    it('should generate correct metadata for first page', () => {
      const result = generatePaginationMetadata(1, 20, 100);
      
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: false
      });
    });

    it('should generate correct metadata for middle page', () => {
      const result = generatePaginationMetadata(3, 20, 100);
      
      expect(result).toEqual({
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should generate correct metadata for last page', () => {
      const result = generatePaginationMetadata(5, 20, 100);
      
      expect(result).toEqual({
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: false,
        hasPrev: true
      });
    });

    it('should handle partial last page', () => {
      const result = generatePaginationMetadata(3, 20, 55);
      
      expect(result).toEqual({
        page: 3,
        limit: 20,
        total: 55,
        totalPages: 3,
        hasNext: false,
        hasPrev: true
      });
    });

    it('should handle single page', () => {
      const result = generatePaginationMetadata(1, 20, 10);
      
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should handle empty results', () => {
      const result = generatePaginationMetadata(1, 20, 0);
      
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    });
  });

  describe('parsePaginationParams', () => {
    it('should parse valid page and limit', () => {
      const result = parsePaginationParams({ page: '2', limit: '50' });
      
      expect(result).toEqual({
        page: 2,
        limit: 50
      });
    });

    it('should use defaults for missing params', () => {
      const result = parsePaginationParams({});
      
      expect(result).toEqual({
        page: 1,
        limit: 20
      });
    });

    it('should enforce minimum page of 1', () => {
      const result = parsePaginationParams({ page: '0' });
      
      expect(result.page).toBe(1);
    });

    it('should enforce minimum page for negative values', () => {
      const result = parsePaginationParams({ page: '-5' });
      
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const result = parsePaginationParams({ limit: '500' });
      
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
      const result = parsePaginationParams({ limit: '0' });
      
      expect(result.limit).toBe(1);
    });

    it('should handle invalid string values', () => {
      const result = parsePaginationParams({ page: 'abc', limit: 'xyz' });
      
      expect(result).toEqual({
        page: 1,
        limit: 20
      });
    });

    it('should handle float values by converting to int', () => {
      const result = parsePaginationParams({ page: '2.7', limit: '25.9' });
      
      expect(result).toEqual({
        page: 2,
        limit: 25
      });
    });
  });

  describe('paginateResponse', () => {
    let mockQuery;
    let mockModel;

    beforeEach(() => {
      // Create mock query object
      mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn(),
        model: null,
        getQuery: jest.fn().mockReturnValue({})
      };

      // Create mock model
      mockModel = {
        countDocuments: jest.fn()
      };

      mockQuery.model = mockModel;
    });

    it('should paginate results with provided total', async () => {
      const mockData = [
        { _id: '1', name: 'Item 1' },
        { _id: '2', name: 'Item 2' }
      ];
      
      mockQuery.lean.mockResolvedValue(mockData);

      const result = await paginateResponse(mockQuery, 1, 20, 100);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        success: true,
        data: mockData,
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
          hasNext: true,
          hasPrev: false
        }
      });
    });

    it('should calculate total if not provided', async () => {
      const mockData = [{ _id: '1', name: 'Item 1' }];
      
      mockQuery.lean.mockResolvedValue(mockData);
      mockModel.countDocuments.mockResolvedValue(50);

      const result = await paginateResponse(mockQuery, 2, 20);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(mockModel.countDocuments).toHaveBeenCalled();
      expect(result.pagination.total).toBe(50);
    });

    it('should handle page 2 correctly', async () => {
      const mockData = [{ _id: '3', name: 'Item 3' }];
      
      mockQuery.lean.mockResolvedValue(mockData);

      const result = await paginateResponse(mockQuery, 2, 20, 100);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should normalize invalid page to 1', async () => {
      const mockData = [];
      
      mockQuery.lean.mockResolvedValue(mockData);

      const result = await paginateResponse(mockQuery, -5, 20, 0);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(result.pagination.page).toBe(1);
    });

    it('should enforce max limit of 100', async () => {
      const mockData = [];
      
      mockQuery.lean.mockResolvedValue(mockData);

      const result = await paginateResponse(mockQuery, 1, 500, 0);

      expect(mockQuery.limit).toHaveBeenCalledWith(100);
      expect(result.pagination.limit).toBe(100);
    });

    it('should use default values when not provided', async () => {
      const mockData = [];
      
      mockQuery.lean.mockResolvedValue(mockData);
      mockModel.countDocuments.mockResolvedValue(0);

      const result = await paginateResponse(mockQuery);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    });
  });
});
