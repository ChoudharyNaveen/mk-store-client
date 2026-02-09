import React, { useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  Tooltip,
  Popover,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DoneIcon from '@mui/icons-material/Done';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import ConfirmDialog from '../../components/ConfirmDialog';
import DateRangePopover from '../../components/DateRangePopover';
import SearchField from '../../components/SearchField';
import type { DateRangeSelection } from '../../components/DateRangePopover';
import { useServerPagination } from '../../hooks/useServerPagination';
import { getNotifications } from '../../services/notification.service';
import type { Notification } from '../../types/notification';
import type { ServerFilter } from '../../types/filter';
import type { ServerPaginationResponse } from '../../hooks/useServerPagination';
import type { FetchParams } from '../../hooks/useServerPagination';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { useNotifications } from '../../contexts/NotificationContext';
import CustomTabs from '../../components/CustomTabs';

export type NotificationCategoryTab = 'all' | 'orders' | 'users' | 'low_stock';

export default function NotificationList() {
  const navigate = useNavigate();
  const { markAllAsRead: contextMarkAllAsRead, markAsRead: contextMarkAsRead, markAsUnread: contextMarkAsUnread, deleteNotification: contextDeleteNotification } = useNotifications();

  const { user } = useAppSelector((state) => state.auth);
  const vendorId = user?.vendorId;

  const [categoryTab, setCategoryTab] = React.useState<NotificationCategoryTab>('all');
  const [dateRange, setDateRange] = React.useState<DateRangeSelection>(getLastNDaysRangeForDatePicker(30));
  const [readFilter, setReadFilter] = React.useState<'all' | 'read' | 'unread'>('all');
  const [markingAllRead, setMarkingAllRead] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<Notification | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = React.useState<HTMLElement | null>(null);
  const infoOpen = Boolean(infoAnchorEl);

  const buildFilters = useCallback((): ServerFilter[] => {
    const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: 'created_at',
    });
    if (readFilter === 'read') {
      additionalFilters.push({ key: 'is_read', eq: '1' });
    } else if (readFilter === 'unread') {
      additionalFilters.push({ key: 'is_read', eq: '0' });
    }
    if (categoryTab === 'orders') {
      additionalFilters.push({ key: 'entity_type', eq: 'ORDER' });
    } else if (categoryTab === 'users') {
      additionalFilters.push({ key: 'entity_type', eq: 'USER' });
    } else if (categoryTab === 'low_stock') {
      additionalFilters.push({ key: 'type', eq: 'LOW_STOCK' });
    }
    return mergeWithDefaultFilters(additionalFilters, vendorId, undefined);
  }, [dateRange, readFilter, categoryTab, vendorId]);

  const fetchNotificationsForTable = useCallback(
    async (params: FetchParams): Promise<ServerPaginationResponse<Notification>> => {
      const filters = Array.isArray(params.filters) ? params.filters : [];
      const res = await getNotifications({
        pageNumber: (params.page ?? 0) + 1,
        pageSize: params.pageSize ?? 10,
        filters,
        sorting: params.sorting ?? [{ key: 'created_at', direction: 'DESC' }],
      });
      return {
        list: res.doc,
        totalCount: res.pagination.totalCount,
        pageDetails: {
          pageNumber: res.pagination.pageNumber,
          pageSize: res.pagination.pageSize,
          paginationEnabled: res.pagination.paginationEnabled,
        },
      };
    },
    []
  );

  const {
    setPaginationModel,
    setFilters,
    setSearchKeyword,
    tableState,
    tableHandlers,
  } = useServerPagination<Notification>({
    fetchFunction: fetchNotificationsForTable,
    initialPageSize: 20,
    enabled: true,
    autoFetch: true,
    filters: buildFilters(),
    initialSorting: [{ key: 'created_at', direction: 'DESC' }],
    searchDebounceMs: 500,
  });

  const refreshTableRef = useRef(tableHandlers.refresh);
  refreshTableRef.current = tableHandlers.refresh;

  useEffect(() => {
    setFilters(buildFilters());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    const t = setTimeout(() => refreshTableRef.current(), 0);
    return () => clearTimeout(t);
  }, [categoryTab, readFilter, dateRange, setFilters, buildFilters, setPaginationModel]);

  const handleDateRangeApply = (newRange: DateRangeSelection) => {
    setDateRange(newRange);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setCategoryTab('all');
    setReadFilter('all');
    setDateRange(getLastNDaysRangeForDatePicker(30));
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await contextMarkAllAsRead();
      refreshTableRef.current();
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleRowClick = (row: Notification) => {
    if (!row.is_read) {
      contextMarkAsRead(row.id);
      refreshTableRef.current();
    }
    if (row.entity_type === 'ORDER' && row.entity_id != null) {
      navigate(`/orders/detail/${row.entity_id}`);
    }
  };

  const handleReadToggle = async (row: Notification) => {
    try {
      if (row.is_read) {
        await contextMarkAsUnread(row.id);
      } else {
        await contextMarkAsRead(row.id);
      }
      refreshTableRef.current();
    } catch {
      // Error already logged in context
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, row: Notification) => {
    e.stopPropagation();
    setDeleteConfirm(row);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await contextDeleteNotification(deleteConfirm.id);
      refreshTableRef.current();
      setDeleteConfirm(null);
    } catch {
      // Error already logged in context
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      id: 'is_read' as keyof Notification,
      label: 'Read',
      minWidth: 100,
      align: 'center' as const,
      render: (row: Notification) => (
        <Chip
          label={row.is_read ? 'Read' : 'Unread'}
          size="small"
          color={row.is_read ? 'default' : 'primary'}
          variant={row.is_read ? 'outlined' : 'filled'}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      id: 'title' as keyof Notification,
      label: 'Title',
      minWidth: 160,
      render: (row: Notification) => (
        <Typography variant="body2" sx={{ fontWeight: row.is_read ? 400 : 600 }}>
          {row.title || '—'}
        </Typography>
      ),
    },
    {
      id: 'message' as keyof Notification,
      label: 'Message',
      minWidth: 220,
      render: (row: Notification) => (
        <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>
          {row.message || '—'}
        </Typography>
      ),
    },
    {
      id: 'type' as keyof Notification,
      label: 'Type',
      minWidth: 120,
      render: (row: Notification) => row.type || '—',
    },
    {
      id: 'created_at' as keyof Notification,
      label: 'Date',
      minWidth: 120,
      render: (row: Notification) => {
        if (!row.created_at) return 'N/A';
        try {
          return format(new Date(row.created_at), 'MMM dd, yyyy HH:mm');
        } catch {
          return row.created_at;
        }
      },
    },
    {
      id: 'action' as keyof Notification,
      label: 'Action',
      minWidth: 80,
      align: 'center' as const,
      render: (row: Notification) => (
        <RowActionsMenu<Notification>
          row={row}
          ariaLabel="Notification actions"
          items={(r): RowActionItem<Notification>[] => [
            { type: 'item', label: r.is_read ? 'Mark as unread' : 'Mark as read', icon: r.is_read ? <MarkEmailUnreadIcon fontSize="small" /> : <DoneIcon fontSize="small" />, onClick: (n) => handleReadToggle(n) },
            { type: 'divider' },
            { type: 'item', label: 'Delete', icon: <DeleteIcon fontSize="small" />, onClick: (n) => setDeleteConfirm(n) },
          ]}
        />
      ),
    },
  ];

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Notifications
          </Typography>
          <Tooltip title="What you see here">
            <IconButton
              size="small"
              onClick={(e) => setInfoAnchorEl(e.currentTarget)}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
              }}
              aria-label="Notification list info"
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Popover
        open={infoOpen}
        anchorEl={infoAnchorEl}
        onClose={() => setInfoAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 1.25,
            maxWidth: 320,
            borderRadius: 2,
            boxShadow: 2,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
            All your notifications in one place
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Notifications from every branch are shown here. You don&apos;t need to switch branches to see alerts—order updates, promotions, and other alerts appear in this list regardless of branch.
          </Typography>
        </Box>
      </Popover>

      <CustomTabs<NotificationCategoryTab>
        tabs={[
          { value: 'all', label: 'All' },
          { value: 'orders', label: 'Orders' },
          { value: 'users', label: 'Users' },
          { value: 'low_stock', label: 'Low Stock' },
        ]}
        value={categoryTab}
        onChange={setCategoryTab}
      />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <SearchField
            placeholder="Search..."
            value={tableState.search}
            onChange={tableHandlers.handleSearch}
            onClearAndRefresh={handleClearFilters}
            sx={{ minWidth: 220 }}
          />

          <DateRangePopover
            value={dateRange}
            onChange={handleDateRangeApply}
            moveRangeOnFirstSelection={false}
            months={2}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            formatLabel={(start, end) => `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`}
            buttonSize="small"
            buttonSx={{ textTransform: 'none' }}
          />
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
              Status:
            </Typography>
            <Chip
              label="All"
              size="small"
              onClick={() => setReadFilter('all')}
              color={readFilter === 'all' ? 'primary' : 'default'}
              variant={readFilter === 'all' ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Unread"
              size="small"
              onClick={() => setReadFilter('unread')}
              color={readFilter === 'unread' ? 'primary' : 'default'}
              variant={readFilter === 'unread' ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Read"
              size="small"
              onClick={() => setReadFilter('read')}
              color={readFilter === 'read' ? 'primary' : 'default'}
              variant={readFilter === 'read' ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
            sx={{ textTransform: 'none' }}
          >
            Mark all read
          </Button>
          <IconButton size="small" onClick={() => tableHandlers.refresh()} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>

        <DataTable
          columns={columns}
          state={tableState}
          handlers={tableHandlers}
          onRowClick={handleRowClick}
          getRowSx={(row) =>
            !row.is_read
              ? {
                  bgcolor: 'rgba(211, 47, 47, 0.06)',
                  borderLeft: '3px solid',
                  borderLeftColor: 'error.main',
                }
              : {}
          }
        />

        <ConfirmDialog
          open={!!deleteConfirm}
          title="Delete notification"
          message={deleteConfirm ? `Are you sure you want to delete "${deleteConfirm.title || 'this notification'}"?` : ''}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmColor="error"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      </Box>
    </Paper>
  );
}
