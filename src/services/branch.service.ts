/**
 * Branch Service
 * Handles all branch-related API calls
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type { BranchListRequest, BranchListResponse } from '../types/branch';

/**
 * Get branches list
 */
export const getBranches = async (
  params: BranchListRequest = { pageSize: 100 }
): Promise<BranchListResponse> => {
  try {
    const response = await http.post<BranchListResponse>(
      API_URLS.BRANCHES.LIST,
      params
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

