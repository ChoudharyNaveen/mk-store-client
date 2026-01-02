/**
 * Filter types for server-side filtering
 * Matches the Joi schema on the backend
 */

export interface ServerFilter {
  key: string;
  eq?: string;
  neq?: string;
  gt?: string;
  gte?: string;
  lt?: string;
  lte?: string;
  like?: string;
  iLike?: string;
  in?: string[];
}

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'iLike' | 'in';

/**
 * Sorting configuration for server-side sorting
 */
export interface ServerSorting {
  key: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Helper function to create a filter object
 */
export const createFilter = (
  key: string,
  operator: FilterOperator,
  value: string | string[]
): ServerFilter => {
  const filter: ServerFilter = { key };
  
  if (operator === 'in') {
    if (Array.isArray(value)) {
      filter.in = value;
    }
  } else if (typeof value === 'string') {
    if (operator === 'eq') filter.eq = value;
    else if (operator === 'neq') filter.neq = value;
    else if (operator === 'gt') filter.gt = value;
    else if (operator === 'gte') filter.gte = value;
    else if (operator === 'lt') filter.lt = value;
    else if (operator === 'lte') filter.lte = value;
    else if (operator === 'like') filter.like = value;
    else if (operator === 'iLike') filter.iLike = value;
  }
  
  return filter;
};

