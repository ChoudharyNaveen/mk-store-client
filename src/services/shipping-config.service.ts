/**
 * Shipping config service
 * Handles branch shipping configuration API (Settings > Shipping Charges)
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type {
  BranchShippingConfigResponse,
  SaveBranchShippingConfigRequest,
} from '../types/shipping-config';

/**
 * Get branch shipping configuration by branch ID
 */
export const getBranchShippingConfig = async (
  branchId: number
): Promise<BranchShippingConfigResponse> => {
  const response = await http.get<BranchShippingConfigResponse>(
    API_URLS.SETTINGS.GET_BRANCH_SHIPPING_CONFIG(branchId)
  );
  return response;
};

/**
 * Save branch shipping configuration (create or update).
 * Same POST endpoint for both create and edit.
 */
export const saveBranchShippingConfig = async (
  body: SaveBranchShippingConfigRequest
): Promise<unknown> => {
  const response = await http.post<unknown>(
    API_URLS.SETTINGS.SAVE_BRANCH_SHIPPING_CONFIG,
    body
  );
  return response;
};
