import React, { useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Popover,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import { getNotifications } from '../../services/notification.service';
import type { Notification } from '../../types/notification';
import type { ServerFilter } from '../../types/filter';
import type { ServerPaginationResponse } from '../../hooks/useServerPagination';
import type { FetchParams } from '../../hooks/useServerPagination';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationList() {
  const navigate = useNavigate();
  const { markAllAsRead: contextMarkAllAsRead, markAsRead: contextMarkAsRead } = useNotifications();

  const { user } = useAppSelector((state) => state.auth);
  const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
  const vendorId = user?.vendorId;

  const [dateRange, setDateRange] = React.useState(getLastNDaysRangeForDatePicker(30));
  const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
  const [readFilter, setReadFilter] = React.useState<'all' | 'read' | 'unread'>('all');
  const [markingAllRead, setMarkingAllRead] = React.useState(false);

  const buildFilters = useCallback((): ServerFilter[] => {
    const filters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: 'created_at',
    });
    if (readFilter === 'read') {
      filters.push({ key: 'is_read', eq: '1' });
    } else if (readFilter === 'unread') {
      filters.push({ key: 'is_read', eq: '0' });
    }
    return filters;
  }, [dateRange, readFilter]);

  const fetchNotificationsForTable = useCallback(
    async (params: FetchParams): Promise<ServerPaginationResponse<Notification>> => {
      const filters = Array.isArray(params.filters) ? params.filters : [];
      const res = await getNotifications({
        pageNumber: (params.page ?? 0) + 1,
        pageSize: params.pageSize ?? 10,
        filters,
        sorting: params.sorting ?? [{ key: 'created_at', direction: 'DESC' }],
        vendorId: vendorId ?? undefined,
        branchId: selectedBranchId ?? undefined,
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
    [vendorId, selectedBranchId]
  );

  const {
    paginationModel,
    setPaginationModel,
    setFilters,
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
    // When switching to "All", the hook may skip refetch (filters match initial). Force refresh.
    if (readFilter === 'all') {
      const t = setTimeout(() => refreshTableRef.current(), 0);
      return () => clearTimeout(t);
    }
  }, [readFilter, dateRange, setFilters, buildFilters, setPaginationModel]);

  const handleDateSelect = (ranges: RangeKeyDict) => {
    if (ranges.selection?.startDate && ranges.selection?.endDate) {
      setDateRange([
        {
          startDate: ranges.selection.startDate,
          endDate: ranges.selection.endDate,
          key: ranges.selection.key || 'selection',
        },
      ]);
    }
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

  const columns = [
    {
      id: 'is_read' as keyof Notification,
      label: 'Read',
      minWidth: 80,
      align: 'center' as const,
      render: (row: Notification) => (
        <Chip
          label={row.is_read ? 'Read' : 'Unread'}
          size="small"
          color={row.is_read ? 'default' : 'primary'}
          variant={row.is_read ? 'outlined' : 'filled'}
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
  ];

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Notifications
        </Typography>
      </Box>

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
          <TextField
            size="small"
            placeholder="Search..."
            value={tableState.search}
            onChange={tableHandlers.handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />

          <Button
            size="small"
            variant="outlined"
            startIcon={<CalendarTodayIcon />}
            onClick={(e) => setDateAnchorEl(e.currentTarget)}
            sx={{ textTransform: 'none' }}
          >
            {dateRange[0]?.startDate && dateRange[0]?.endDate
              ? `${format(dateRange[0].startDate, 'MMM d, yyyy')} – ${format(dateRange[0].endDate, 'MMM d, yyyy')}`
              : 'Date range'}
          </Button>
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

        <Popover
          open={Boolean(dateAnchorEl)}
          anchorEl={dateAnchorEl}
          onClose={() => setDateAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Box sx={{ p: 1 }}>
            <DateRangePicker
              ranges={dateRange}
              onChange={handleDateSelect}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" onClick={() => setDateAnchorEl(null)}>
                Close
              </Button>
            </Box>
          </Box>
        </Popover>

        <DataTable
          columns={columns}
          state={tableState}
          handlers={tableHandlers}
          onRowClick={handleRowClick}
        />
      </Box>
    </Paper>
  );
}
