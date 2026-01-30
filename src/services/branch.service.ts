/**
 * Branch Service
 * Handles all branch-related API calls
 * Follows same filter structure as other list modules (orders, categories, etc.)
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { BranchListRequest, BranchListResponse } from '../types/branch';

/**
 * Get branches list with pagination and filters
 */
export const getBranches = async (
  params: BranchListRequest = { pageSize: 100 }
): Promise<BranchListResponse> => {
  try {
    const requestBody = {
      pageSize: params.pageSize ?? 100,
      pageNumber: params.pageNumber ?? 1,
      filters: params.filters ?? [],
    };
    const response = await http.post<BranchListResponse>(
      API_URLS.BRANCHES.LIST,
      requestBody
    );
    return response;
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};

const branchService = {
  getBranches,
};

export default branchService;

