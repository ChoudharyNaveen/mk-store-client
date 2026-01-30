/**
 * Filter Builder Utility
 * Converts filter objects to query string format: filters[0][key]=id&filters[0][eq]=2
 */

import { format, addDays } from 'date-fns';
import type { ServerFilter } from '../types/filter';

/**
 * Date range type for react-date-range
 */
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  key: string;
}

/**
 * Configuration for building filters from date range and advanced filters
 */
export interface BuildFiltersConfig {
  /**
   * Date range from react-date-range picker
   */
  dateRange?: DateRange[];
  /**
   * Field name for date filtering (default: 'createdAt')
   */
  dateField?: string;
  /**
   * Advanced filters object (e.g., { categoryName: 'value' }). Use arrays with operator 'in' for multi-select.
   */
  advancedFilters?: Record<string, string | number | boolean | null | undefined | (string | number)[]>;
  /**
   * Mapping of advanced filter keys to API field names and operators
   * Example: { categoryName: { field: 'title', operator: 'iLike' } }
   */
  filterMappings?: Record<
    string,
    {
      field: string;
      operator?: 'eq' | 'neq' | 'like' | 'iLike' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
    }
  >;
}

/**
 * Build ServerFilter array from date range and advanced filters
 * This is a reusable utility for list pages that need to combine date range and advanced filters
 * 
 * @param config - Configuration object with dateRange, advancedFilters, and mappings
 * @returns Array of ServerFilter objects ready to be sent to the API
 * 
 * @example
 * ```ts
 * const filters = buildFiltersFromDateRangeAndAdvanced({
 *   dateRange: dateRangeState,
 *   dateField: 'createdAt',
 *   advancedFilters: { categoryName: 'Grocery' },
 *   filterMappings: {
 *     categoryName: { field: 'title', operator: 'iLike' }
 *   }
 * });
 * ```
 */
export const buildFiltersFromDateRangeAndAdvanced = (
  config: BuildFiltersConfig
): ServerFilter[] => {
  const {
    dateRange,
    dateField = 'createdAt',
    advancedFilters,
    filterMappings = {},
  } = config;

  const filters: ServerFilter[] = [];

  // Add date range filters
  if (dateRange && dateRange.length > 0) {
    const range = dateRange[0];
    if (range.startDate) {
      filters.push({
        key: dateField,
        gte: format(range.startDate, 'yyyy-MM-dd'),
      });
    }
    if (range.endDate) {
      // API receives end date + 1 day so the selected end day is inclusive (e.g. Jan 5 selected → lte Jan 6)
      const endDateForApi = addDays(range.endDate, 1);
      filters.push({
        key: dateField,
        lte: format(endDateForApi, 'yyyy-MM-dd'),
      });
    }
  }

  // Add advanced filters based on mappings
  if (advancedFilters && filterMappings) {
    Object.entries(advancedFilters).forEach(([filterKey, filterValue]) => {
      // Skip empty values
      if (filterValue === undefined || filterValue === null || filterValue === '') {
        return;
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) {
        return;
      }

      const mapping = filterMappings[filterKey];
      if (mapping) {
        const { field, operator = 'eq' } = mapping;
        const filter: ServerFilter = { key: field };

        switch (operator) {
          case 'eq':
            filter.eq = String(filterValue);
            break;
          case 'neq':
            filter.neq = String(filterValue);
            break;
          case 'like':
            filter.like = String(filterValue);
            break;
          case 'iLike':
            filter.iLike = String(filterValue);
            break;
          case 'gt':
            filter.gt = String(filterValue);
            break;
          case 'gte':
            filter.gte = String(filterValue);
            break;
          case 'lt':
            filter.lt = String(filterValue);
            break;
          case 'lte':
            filter.lte = String(filterValue);
            break;
          case 'in':
            if (Array.isArray(filterValue)) {
              filter.in = filterValue.map(String);
            }
            break;
        }

        filters.push(filter);
      }
    });
  }

  return filters;
};

/**
 * Build filter query string from array of filters
 * Format: filters[0][key]=id&filters[0][eq]=2&filters[1][key]=status&filters[1][eq]=ACTIVE
 */
export const buildFilterQueryString = (filters: ServerFilter[]): string => {
  if (!filters || filters.length === 0) {
    return '';
  }

  const params: string[] = [];

  filters.forEach((filter, index) => {
    // Add key
    params.push(`filters[${index}][key]=${encodeURIComponent(filter.key)}`);

    // Add operator and value
    if (filter.eq !== undefined) {
      params.push(`filters[${index}][eq]=${encodeURIComponent(filter.eq)}`);
    } else if (filter.neq !== undefined) {
      params.push(`filters[${index}][neq]=${encodeURIComponent(filter.neq)}`);
    } else if (filter.gt !== undefined) {
      params.push(`filters[${index}][gt]=${encodeURIComponent(filter.gt)}`);
    } else if (filter.gte !== undefined) {
      params.push(`filters[${index}][gte]=${encodeURIComponent(filter.gte)}`);
    } else if (filter.lt !== undefined) {
      params.push(`filters[${index}][lt]=${encodeURIComponent(filter.lt)}`);
    } else if (filter.lte !== undefined) {
      params.push(`filters[${index}][lte]=${encodeURIComponent(filter.lte)}`);
    } else if (filter.like !== undefined) {
      params.push(`filters[${index}][like]=${encodeURIComponent(filter.like)}`);
    } else if (filter.iLike !== undefined) {
      params.push(`filters[${index}][iLike]=${encodeURIComponent(filter.iLike)}`);
    } else if (filter.in !== undefined && Array.isArray(filter.in)) {
      // For 'in' operator, add each value as filters[0][in][0]=value1&filters[0][in][1]=value2
      filter.in.forEach((value, valueIndex) => {
        params.push(`filters[${index}][in][${valueIndex}]=${encodeURIComponent(value)}`);
      });
    }
  });

  return params.join('&');
};

/**
 * Convert simple filter object to ServerFilter array
 * Helper to convert { id: 2, status: 'ACTIVE' } to filter array format
 */
export const convertSimpleFiltersToServerFilters = (
  filters: Record<string, string | number | boolean | null | undefined>
): ServerFilter[] => {
  const serverFilters: ServerFilter[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      serverFilters.push({
        key,
        eq: String(value),
      });
    }
  });

  return serverFilters;
};

/**
 * Helper to create filters with different operators
 * Example usage:
 * - createEqFilter('id', '2') -> { key: 'id', eq: '2' }
 * - createLikeFilter('title', 'Grocery') -> { key: 'title', like: 'Grocery' }
 * - createInFilter('status', ['ACTIVE', 'INACTIVE']) -> { key: 'status', in: ['ACTIVE', 'INACTIVE'] }
 */
export const createEqFilter = (key: string, value: string | number): ServerFilter => ({
  key,
  eq: String(value),
});

export const createNeqFilter = (key: string, value: string | number): ServerFilter => ({
  key,
  neq: String(value),
});

export const createGtFilter = (key: string, value: string | number): ServerFilter => ({
  key,
  gt: String(value),
});

export const createGteFilter = (key: string, value: string | number): ServerFilter => ({
  key,
  gte: String(value),
});

export const createLtFilter = (key: string, value: string | number): ServerFilter => ({
  key,
  lt: String(value),
});

export const createLteFilter = (key: string, value: string | number): ServerFilter => ({
  key,
  lte: String(value),
});

export const createLikeFilter = (key: string, value: string): ServerFilter => ({
  key,
  like: value,
});

export const createILikeFilter = (key: string, value: string): ServerFilter => ({
  key,
  iLike: value,
});

export const createInFilter = (key: string, values: string[]): ServerFilter => ({
  key,
  in: values,
});

/**
 * Create default filters for vendorId and branchId
 * These filters are always applied to ensure data is scoped to the current vendor and branch
 * 
 * @param vendorId - Vendor ID from auth store
 * @param branchId - Selected branch ID from branch store
 * @returns Array of default ServerFilter objects
 * 
 * @example
 * ```ts
 * const defaultFilters = createDefaultFilters(vendorId, branchId);
 * const allFilters = [...defaultFilters, ...otherFilters];
 * ```
 */
export const createDefaultFilters = (
  vendorId: number | null | undefined,
  branchId: number | null | undefined
): ServerFilter[] => {
  const filters: ServerFilter[] = [];

  // Add vendorId filter if available
  if (vendorId !== null && vendorId !== undefined) {
    filters.push({
      key: 'vendorId',
      eq: String(vendorId),
    });
  }

  // Add branchId filter if available
  if (branchId !== null && branchId !== undefined) {
    filters.push({
      key: 'branchId',
      eq: String(branchId),
    });
  }

  return filters;
};

/**
 * Merge default filters (vendorId, branchId) with additional filters
 * This ensures that vendor and branch scoping is always applied
 * 
 * @param additionalFilters - Additional filters to merge with defaults
 * @param vendorId - Vendor ID from auth store
 * @param branchId - Selected branch ID from branch store
 * @returns Combined array of ServerFilter objects with defaults first
 * 
 * @example
 * ```ts
 * const filters = mergeWithDefaultFilters(
 *   buildFiltersFromDateRangeAndAdvanced({ ... }),
 *   vendorId,
 *   branchId
 * );
 * ```
 */
export const mergeWithDefaultFilters = (
  additionalFilters: ServerFilter[],
  vendorId: number | null | undefined,
  branchId: number | null | undefined
): ServerFilter[] => {
  const defaultFilters = createDefaultFilters(vendorId, branchId);
  return [...defaultFilters, ...additionalFilters];
};

