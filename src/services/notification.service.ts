/**
 * Notification Service
 * Handles all notification-related API calls
 */

import http from '../utils/http';
import { API_URLS } from '../constants/urls';
import type {
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
  MarkAllReadResponse,
  DeleteNotificationResponse,
} from '../types/notification';
import type { ServerFilter, ServerSorting } from '../types/filter';

export interface GetNotificationsParams {
  pageSize?: number;
  pageNumber?: number;
  filters?: ServerFilter[];
  sorting?: ServerSorting[];
  recipientId?: number;
  recipientType?: string;
  vendorId?: number | null;
  branchId?: number | null;
}

export interface GetUnreadCountParams {
  vendorId?: number | null;
  branchId?: number | null;
}

/**
 * Get notifications with pagination and filters
 */
export const getNotifications = async (
  params: GetNotificationsParams
): Promise<NotificationListResponse> => {
  try {
    const response = await http.post<NotificationListResponse>(
      API_URLS.NOTIFICATIONS.LIST,
      {
        pageSize: params.pageSize || 10,
        pageNumber: params.pageNumber || 1,
        filters: params.filters || [],
        sorting: params.sorting || [{ key: 'created_at', direction: 'DESC' }],
        recipientId: params.recipientId,
        recipientType: params.recipientType,
        vendorId: params.vendorId,
        branchId: params.branchId,
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (
  params: GetUnreadCountParams = {}
): Promise<UnreadCountResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.vendorId) queryParams.append('vendorId', params.vendorId.toString());
    if (params.branchId) queryParams.append('branchId', params.branchId.toString());

    const url = `${API_URLS.NOTIFICATIONS.GET_UNREAD_COUNT}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await http.get<UnreadCountResponse>(url);
    return response;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (
  notificationId: number
): Promise<MarkReadResponse> => {
  try {
    const response = await http.patch<MarkReadResponse>(
      API_URLS.NOTIFICATIONS.MARK_READ(notificationId)
    );
    return response;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (): Promise<MarkAllReadResponse> => {
  try {
    const response = await http.patch<MarkAllReadResponse>(
      API_URLS.NOTIFICATIONS.MARK_ALL_READ
    );
    return response;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: number
): Promise<DeleteNotificationResponse> => {
  try {
    const response = await http.delete<DeleteNotificationResponse>(
      API_URLS.NOTIFICATIONS.DELETE(notificationId)
    );
    return response;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};
