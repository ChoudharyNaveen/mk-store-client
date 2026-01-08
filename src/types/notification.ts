/**
 * Notification related types
 */

export type NotificationType = 'ORDER_PLACED' | 'ORDER_UPDATED' | 'USER_LOGIN' | string;
export type NotificationRecipientType = 'USER' | 'VENDOR' | 'BRANCH' | 'ADMIN' | 'ALL';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type EntityType = 'ORDER' | 'USER' | string | null;

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  recipient_type: NotificationRecipientType;
  recipient_id: number | null;
  vendor_id: number | null;
  branch_id: number | null;
  entity_type: EntityType;
  entity_id: number | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  priority: NotificationPriority;
  status: NotificationStatus;
  action_url: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  success: boolean;
  doc: Notification[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    totalPages?: number;
    paginationEnabled: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface MarkReadResponse {
  success: boolean;
  doc: {
    id: number;
    is_read: boolean;
    read_at: string;
  };
}

export interface MarkAllReadResponse {
  success: boolean;
  message: string;
  updatedCount: number;
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}
