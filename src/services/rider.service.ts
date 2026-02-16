/**
 * Rider Service
 * Handles rider-specific APIs like rider-stats
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';

export interface RiderStats {
  id: number;
  user_id: number;
  vendor_id: number;
  total_orders: number;
  total_deliveries: number;
  completed_orders: number;
  cancelled_orders: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface RiderStatsResponse {
  success: boolean;
  doc: RiderStats;
}

/**
 * Fetch rider stats for a given user id.
 * GET /rider-stats?userId={id}
 */
export const fetchRiderStats = async (
  userId: string | number,
): Promise<RiderStats | null> => {
  try {
    const url = `${API_URLS.RIDERS.STATS}?userId=${encodeURIComponent(String(userId))}`;
    const response = await http.get<RiderStatsResponse>(url);
    if (response.success && response.doc) {
      return response.doc;
    }
    return null;
  } catch (error) {
    console.error('Error fetching rider stats:', error);
    return null;
  }
};

