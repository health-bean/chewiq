/**
 * UNIFIED FOOD SEARCH HOOK TESTS - Phase 2.3
 * Comprehensive test suite for the unified food search hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFoodSearch } from '../useFoodSearchUnified';
import { apiClient } from '../../services/api';

// Mock the API client
jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn()
  }
}));

describe('useFoodSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    test('should initialize with empty state', () => {
      const { result } = renderHook(() => useFoodSearch());
      
      expect(result.current.foods).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.searchTerm).toBe('');
      expect(result.current.totalResults).toBe(0);
    });

    test('should handle empty search gracefully', async () => {
      const { result } = renderHook(() => useFoodSearch());
      
      await act(async () => {
        result.current.searchFoods('');
      });
      
      expect(result.current.foods).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.searchTerm).toBe('');
    });

    test('should clear results', async () => {
      const { result } = renderHook(() => useFoodSearch());
      
      // Set some initial state
      await act(async () => {
        result.current.searchFoods('chicken');
      });
      
      act(() => {
        result.current.clearResults();
      });
      
      expect(result.current.foods).toEqual([]);
      expect(result.current.searchTerm).toBe('');
      expect(result.current.error).toBe(null);
    });
  });

  describe('Search Functionality', () => {
    test('should perform search and update state', async () => {
      const mockResponse = {
        foods: [
          { id: '1', name: 'Chicken Breast', category: 'Proteins' },
          { id: '2', name: 'Chicken Thigh', category: 'Proteins' }
        ],
        total: 2
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);
      
      const { result } = renderHook(() => useFoodSearch());
      
      await act(async () => {
        result.current.searchFoods('chicken');
        jest.advanceTimersByTime(300); // Advance past debounce
      });
      
      await waitFor(() => {
        expect(result.current.foods).toEqual(mockResponse.foods);
        expect(result.current.loading).toBe(false);
        expect(result.current.searchTerm).toBe('chicken');
        expect(result.current.totalResults).toBe(2);
      });
      
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/foods/search?search=chicken')
      );
    });

    test('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      apiClient.get.mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useFoodSearch());
      
      await act(async () => {
        result.current.searchFoods('chicken');
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.foods).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Debouncing', () => {
    test('should debounce rapid searches', async () => {
      const mockResponse = {
        foods: [{ id: '1', name: 'Chicken', category: 'Proteins' }],
        total: 1
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useFoodSearch({ debounceMs: 100 }));
      
      // Make rapid searches
      act(() => {
        result.current.searchFoods('ch');
        result.current.searchFoods('chi');
        result.current.searchFoods('chic');
        result.current.searchFoods('chick');
      });
      
      // Advance timers
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(1);
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('search=chick')
        );
      });
    });
  });

  describe('Caching', () => {
    test('should cache search results', async () => {
      const mockResponse = {
        foods: [{ id: '1', name: 'Apple', category: 'Fruits' }],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);
      
      const { result } = renderHook(() => useFoodSearch());
      
      // First search
      await act(async () => {
        result.current.searchFoods('apple');
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(result.current.foods).toEqual(mockResponse.foods);
      });
      
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      
      // Second search with same term should use cache
      await act(async () => {
        result.current.searchFoods('apple');
        jest.advanceTimersByTime(300);
      });
      
      // Should still only have called API once
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(result.current.foods).toEqual(mockResponse.foods);
    });

    test('should clear cache when requested', async () => {
      const mockResponse = {
        foods: [{ id: '1', name: 'Apple', category: 'Fruits' }],
        total: 1
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useFoodSearch());
      
      // First search
      await act(async () => {
        result.current.searchFoods('apple');
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(result.current.foods).toEqual(mockResponse.foods);
      });
      
      // Clear cache
      act(() => {
        result.current.clearCache();
      });
      
      // Search again - should make new API call
      await act(async () => {
        result.current.searchFoods('apple');
        jest.advanceTimersByTime(300);
      });
      
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Protocol-Aware Search', () => {
    test('should include protocol_id in API call when provided', async () => {
      const mockResponse = {
        foods: [
          { 
            id: '1', 
            name: 'Chicken', 
            category: 'Proteins',
            compliance_status: 'allowed'
          }
        ],
        total: 1
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);
      
      const { result } = renderHook(() => useFoodSearch({ protocolId: 'aip-123' }));
      
      await act(async () => {
        result.current.searchFoods('chicken');
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('protocol_id=aip-123')
        );
      });
    });

    test('should invalidate protocol cache correctly', async () => {
      const { result } = renderHook(() => useFoodSearch());
      
      const invalidatedCount = act(() => {
        return result.current.invalidateProtocolCache('old-protocol', 'new-protocol');
      });
      
      // Should return number of invalidated entries
      expect(typeof invalidatedCount).toBe('number');
    });
  });

  describe('Food Deduplication', () => {
    test('should deduplicate foods with same name', async () => {
      const mockResponse = {
        foods: [
          { id: '1', name: 'Chicken Breast', category: 'Proteins' },
          { id: '2', name: 'chicken breast', category: 'Proteins' }, // Duplicate with different case
          { id: '3', name: 'Chicken Thigh', category: 'Proteins' }
        ],
        total: 3
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);
      
      const { result } = renderHook(() => useFoodSearch());
      
      await act(async () => {
        result.current.searchFoods('chicken');
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(result.current.foods).toHaveLength(2); // Should be deduplicated
        expect(result.current.foods.map(f => f.name.toLowerCase())).toEqual([
          'chicken breast',
          'chicken thigh'
        ]);
      });
    });

    test('should prioritize foods with compliance status in deduplication', async () => {
      const mockResponse = {
        foods: [
          { id: '1', name: 'Tomato', compliance_status: null },
          { id: '2', name: 'tomato', compliance_status: 'avoid' } // Should be prioritized
        ],
        total: 2
      };
      
      apiClient.get.mockResolvedValueOnce(mockResponse);
      
      const { result } = renderHook(() => useFoodSearch());
      
      await act(async () => {
        result.current.searchFoods('tomato');
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(result.current.foods).toHaveLength(1);
        expect(result.current.foods[0].compliance_status).toBe('avoid');
      });
    });
  });

  describe('Cache Statistics', () => {
    test('should provide cache statistics', () => {
      const { result } = renderHook(() => useFoodSearch());
      
      const stats = result.current.cacheStats;
      
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('Request Cancellation', () => {
    test('should cancel previous requests when new search is made', async () => {
      const mockResponse1 = {
        foods: [{ id: '1', name: 'Apple', category: 'Fruits' }],
        total: 1
      };
      
      const mockResponse2 = {
        foods: [{ id: '2', name: 'Banana', category: 'Fruits' }],
        total: 1
      };
      
      // First call resolves slowly
      apiClient.get.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse1), 500))
      );
      
      // Second call resolves quickly
      apiClient.get.mockImplementationOnce(() => 
        Promise.resolve(mockResponse2)
      );
      
      const { result } = renderHook(() => useFoodSearch({ debounceMs: 50 }));
      
      // Start first search
      act(() => {
        result.current.searchFoods('apple');
      });
      
      // Start second search before first completes
      act(() => {
        result.current.searchFoods('banana');
        jest.advanceTimersByTime(50);
      });
      
      await waitFor(() => {
        // Should show results from second search only
        expect(result.current.foods).toEqual(mockResponse2.foods);
        expect(result.current.searchTerm).toBe('banana');
      });
    });
  });
});