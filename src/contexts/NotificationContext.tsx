/**
 * Notification Context
 * Provides notification state and functions throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import socketService from '../services/socketService';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type GetNotificationsParams,
} from '../services/notification.service';
import type { Notification } from '../types/notification';
import { useAppSelector } from '../store/hooks';
import type { User } from '../types/auth';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    totalPages?: number;
    paginationEnabled: boolean;
  };
  fetchNotifications: (params?: Partial<GetNotificationsParams>) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  newOrderNotification: Notification | null;
  setNewOrderNotification: (notification: Notification | null) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  user: User | null;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newOrderNotification, setNewOrderNotification] = useState<Notification | null>(null);
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageNumber: 1,
    totalCount: 0,
    totalPages: 0,
    paginationEnabled: true,
  });

  const token = useAppSelector((state) => state.auth.token);
  const branchId = useAppSelector((state) => state.branch.selectedBranchId);

  // Use refs to track listener registration and store stable handler
  const listenerRegisteredRef = useRef(false);
  const handlerRef = useRef<((notification: unknown) => void) | null>(null);
  const isMountedRef = useRef(true);

  // Initialize socket connection (only runs when user/token changes)
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    
    if (!user || !token) {
      return;
    }

    // Only connect if not already connected
    const socket = socketService.getSocket();
    if (!socket?.connected) {
      socketService.connect(
        token,
        user.id,
        user.roleName || 'USER',
        user.vendorId,
        branchId
      );
    }

    // Create handler function only once and store in ref
    if (!handlerRef.current) {
      handlerRef.current = (notification: unknown) => {
        setTimeout(() => {
          if (!isMountedRef.current) {
            return;
          }

          try {
            if (!notification || typeof notification !== 'object') {
              return;
            }

            const notif = notification as Notification;
            
            if (!notif.id || !notif.type || !notif.title || !notif.message) {
              return;
            }
            
            // Update notifications list and unread count
            setTimeout(() => {
              if (!isMountedRef.current) {
                return;
              }

              try {
                setNotifications((prev) => {
                  if (!Array.isArray(prev)) {
                    return [notif];
                  }
                  
                  if (prev.some(n => n && n.id === notif.id)) {
                    return prev;
                  }
                  
                  return [notif, ...prev];
                });
                
                // Increment unread count if notification is unread
                if (!notif.is_read) {
                  setUnreadCount((prev) => prev + 1);
                }
              } catch (err) {
                console.error('Error updating notifications state:', err);
              }
            }, 50);
            
            // If it's an ORDER_PLACED notification, show the dialog
            if (notif.type === 'ORDER_PLACED' && notif.entity_id && typeof notif.entity_id === 'number') {
              requestAnimationFrame(() => {
                if (!isMountedRef.current) {
                  return;
                }
                
                try {
                  if (notif && notif.entity_id && typeof notif.entity_id === 'number') {
                    if (!isMountedRef.current) {
                      return;
                    }
                    
                    try {
                      setNewOrderNotification((prev) => {
                        if (prev && prev.id === notif.id) {
                          return prev;
                        }
                        return notif;
                      });
                    } catch (setStateError) {
                      console.error('Error in setNewOrderNotification state update:', setStateError);
                    }
                  }
                } catch (err) {
                  console.error('Error setting new order notification:', err);
                }
              });
            }
          } catch (error) {
            console.error('Error handling notification:', error);
          }
        }, 0);
      };
    }

    // Register listener only if not already registered
    if (!listenerRegisteredRef.current && handlerRef.current) {
      socketService.onNotification(handlerRef.current);
      listenerRegisteredRef.current = true;
    }

    // Cleanup: only remove listener on unmount or when dependencies actually change
    return () => {
      isMountedRef.current = false;
      
      if (listenerRegisteredRef.current && handlerRef.current) {
        socketService.offNotification(handlerRef.current);
        listenerRegisteredRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]); // Removed branchId from dependencies - we don't want to re-register listener when branchId changes

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (params: Partial<GetNotificationsParams> = {}) => {
      if (!user) return;

      setLoading(true);
      try {
        const response = await getNotifications({
          pageSize: pagination.pageSize,
          pageNumber: params.pageNumber || pagination.pageNumber,
          recipientId: user.id,
          recipientType: user.roleName || 'USER',
          vendorId: user.vendorId,
          branchId: branchId,
          ...params,
        });

        if (params.pageNumber === 1 || !params.pageNumber) {
          setNotifications(response.doc);
        } else {
          setNotifications((prev) => [...prev, ...response.doc]);
        }

        setPagination({
          pageSize: response.pagination.pageSize,
          pageNumber: response.pagination.pageNumber,
          totalCount: response.pagination.totalCount,
          totalPages: response.pagination.totalPages || Math.ceil(response.pagination.totalCount / response.pagination.pageSize),
          paginationEnabled: response.pagination.paginationEnabled,
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [user, branchId, pagination.pageSize, pagination.pageNumber]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await getUnreadCount({
        vendorId: user.vendorId,
        branchId: branchId,
      });
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user, branchId]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const handleDeleteNotification = useCallback(async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      // Update unread count if notification was unread
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Disconnect socket when user logs out
  useEffect(() => {
    if (!user || !token) {
      socketService.disconnect();
    }
  }, [user, token]);

  // Load initial data
  useEffect(() => {
    if (user) {
      fetchNotifications({ pageNumber: 1 });
      fetchUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, fetchNotifications and fetchUnreadCount are stable

  // Memoize context value to prevent unnecessary re-renders
  const value: NotificationContextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      pagination,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification: handleDeleteNotification,
      newOrderNotification,
      setNewOrderNotification,
    }),
    [
      notifications,
      unreadCount,
      loading,
      pagination,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      handleDeleteNotification,
      newOrderNotification,
      setNewOrderNotification,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
