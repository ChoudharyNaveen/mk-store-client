import React from 'react';
import {
  Popover,
  Paper,
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import type { Notification } from '../types/notification';

export interface NotificationPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

function getPriorityColor(priority: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (priority) {
    case 'URGENT':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'primary';
    default:
      return 'default';
  }
}

export default function NotificationPopover({ anchorEl, open, onClose }: NotificationPopoverProps) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationItemClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.entity_type === 'ORDER' && notification.entity_id != null) {
      navigate(`/orders/detail/${notification.entity_id}`);
    } else if (notification.action_url) {
      navigate(notification.action_url);
    }
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: 400,
          mt: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                startIcon={<CheckCircleIcon />}
              >
                Mark all read
              </Button>
            )}
          </Stack>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 300px)',
          }}
        >
          {notificationsLoading && notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  onClick={() => handleNotificationItemClick(notification)}
                  sx={{
                    cursor: 'pointer',
                    position: 'relative',
                    bgcolor: notification.is_read
                      ? 'background.paper'
                      : (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(25, 118, 210, 0.12)'
                            : 'rgba(25, 118, 210, 0.08)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    borderLeft: notification.is_read ? 'none' : '4px solid',
                    borderLeftColor: notification.is_read ? 'transparent' : 'primary.main',
                    py: 1.5,
                    px: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: notification.is_read
                        ? 'action.hover'
                        : (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(25, 118, 210, 0.2)'
                              : 'rgba(25, 118, 210, 0.12)',
                      transform: 'translateX(2px)',
                    },
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      sx={{
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'error.main',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="body2"
                          fontWeight={notification.is_read ? 400 : 700}
                          color={notification.is_read ? 'text.primary' : 'primary.dark'}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority)}
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        {!notification.is_read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="caption"
                          color={notification.is_read ? 'text.secondary' : 'text.primary'}
                          component="div"
                          display="block"
                          sx={{
                            mt: 0.5,
                            fontWeight: notification.is_read ? 400 : 500,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="div"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          {notification.created_at
                            ? (() => {
                                try {
                                  const date = new Date(notification.created_at);
                                  return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'PPp');
                                } catch {
                                  return 'Invalid Date';
                                }
                              })()
                            : 'N/A'}
                        </Typography>
                      </>
                    }
                    secondaryTypographyProps={{
                      component: 'div',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </Popover>
  );
}
