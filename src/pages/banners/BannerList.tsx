import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Paper, Chip, Select, MenuItem, FormControl, InputLabel, Avatar, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchBanners, deleteBanner } from '../../services/banner.service';
import type { Banner } from '../../types/banner';
import type { ServerFilter } from '../../types/filter';
import type { Column, TableState } from '../../types/table';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

interface AdvancedFilters {
  status: string;
  vendorId: string;
  branchId: string;
  subCategoryId: string;
}

export default function BannerList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get vendorId and branchId from store
  const { user } = useAppSelector((state) => state.auth);
  const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
  const vendorId = user?.vendorId;
  
  // Get date range from store, or use default
  const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
  const storeEndDate = useAppSelector((state) => state.dateRange.endDate);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [bannerToDelete, setBannerToDelete] = React.useState<Banner | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const columns: Column<Banner>[] = [
    {
      id: 'id' as keyof Banner,
      label: 'ID',
      minWidth: 60,
    },
    {
      id: 'image_url' as keyof Banner,
      label: 'Image',
      minWidth: 100,
      render: (row: Banner) => {
        const imageUrl = row.image_url || row.imageUrl;
        return (
          <Avatar
            src={imageUrl}
            alt="Banner"
            variant="rounded"
            sx={{ width: 80, height: 50, cursor: 'pointer' }}
            onClick={() => window.open(imageUrl, '_blank')}
          />
        );
      }
    },
    {
      id: 'vendor' as keyof Banner,
      label: 'Vendor',
      minWidth: 120,
      render: (row: Banner) => row.vendor?.name || 'N/A'
    },
    {
      id: 'branch' as keyof Banner,
      label: 'Branch',
      minWidth: 120,
      render: (row: Banner) => row.branch?.name || 'N/A'
    },
    {
      id: 'subCategory' as keyof Banner,
      label: 'Subcategory',
      minWidth: 120,
      render: (row: Banner) => row.subCategory?.title || 'None'
    },
    {
      id: 'display_order' as keyof Banner,
      label: 'Display Order',
      minWidth: 100,
      align: 'right' as const,
      render: (row: Banner) => row.display_order ?? row.displayOrder ?? 0
    },
    {
      id: 'status' as keyof Banner,
      label: 'Status',
      minWidth: 100,
      render: (row: Banner) => {
        const status = row.status;
        if (!status) return 'N/A';
        return (
          <Chip
            label={status}
            size="small"
            color={status === 'ACTIVE' ? 'success' : 'default'}
            sx={{ fontWeight: 500 }}
          />
        );
      }
    },
    {
      id: 'created_at' as keyof Banner,
      label: 'Created Date',
      minWidth: 120,
      render: (row: Banner) => {
        const createdDate = row.created_at ?? row.createdAt;
        return createdDate ? format(new Date(createdDate), 'MMM dd, yyyy') : 'N/A';
      }
    },
    {
      id: 'action' as keyof Banner,
      label: 'Action',
      minWidth: 120,
      align: 'center' as const,
      render: (row: Banner) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={() => navigate(`/banners/detail/${row.id}`)}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              color: 'text.secondary',
              '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => navigate(`/banners/edit/${row.id}`)}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setBannerToDelete(row);
              setDeleteDialogOpen(true);
            }}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              color: 'error.main',
              bgcolor: '#ffebee',
              '&:hover': { bgcolor: '#ffcdd2', borderColor: 'error.main' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    },
  ];
  
  const [dateRange, setDateRange] = React.useState(() => {
    if (storeStartDate && storeEndDate) {
      return [{
        startDate: new Date(storeStartDate),
        endDate: new Date(storeEndDate),
        key: 'selection'
      }];
    }
    return getLastNDaysRangeForDatePicker(30);
  });
  const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFilters>({
    status: '',
    vendorId: '',
    branchId: '',
    subCategoryId: '',
  });

  // Helper function to build filters array with date range and default filters
  const buildFilters = React.useCallback((): ServerFilter[] => {
    const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: 'created_at',
      advancedFilters: advancedFilters as unknown as Record<string, string | number | boolean | null | undefined>,
      filterMappings: {
        status: { field: 'status', operator: 'eq' },
        vendorId: { field: 'vendor_id', operator: 'eq' },
        branchId: { field: 'branch_id', operator: 'eq' },
        subCategoryId: { field: 'sub_category_id', operator: 'eq' },
      },
    });
    
    // Merge with default filters (vendorId and branchId)
    return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
  }, [dateRange, advancedFilters, vendorId, selectedBranchId]);

  // Use server pagination hook
  const {
    paginationModel,
    setPaginationModel,
    setFilters,
    tableState,
    tableHandlers,
  } = useServerPagination<Banner>({
    fetchFunction: fetchBanners,
    initialPageSize: 20,
    enabled: true,
    autoFetch: true,
    filters: buildFilters(),
    initialSorting: [
      {
        key: 'display_order',
        direction: 'ASC',
      },
      {
        key: 'created_at',
        direction: 'DESC',
      },
    ],
    searchDebounceMs: 500,
  });

  // Sync local date range with store when store dates change
  React.useEffect(() => {
    if (storeStartDate && storeEndDate) {
      setDateRange([{
        startDate: new Date(storeStartDate),
        endDate: new Date(storeEndDate),
        key: 'selection'
      }]);
    }
  }, [storeStartDate, storeEndDate]);

  // Update filters when advanced filters or date range changes
  React.useEffect(() => {
    setFilters(buildFilters());
    // Reset to first page when filters change
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [advancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

  const handleApplyFilters = () => {
    setFilterAnchorEl(null);
    tableHandlers.refresh();
  };

  const handleClearFilters = () => {
    setAdvancedFilters({ status: '', vendorId: '', branchId: '', subCategoryId: '' });
    tableHandlers.refresh();
  };

  const handleDateSelect = (ranges: RangeKeyDict) => {
    if (ranges.selection && ranges.selection.startDate && ranges.selection.endDate) {
      const newDateRange = [{
        startDate: ranges.selection.startDate,
        endDate: ranges.selection.endDate,
        key: ranges.selection.key || 'selection'
      }];
      setDateRange(newDateRange);
      
      // Save to store
      dispatch(setDateRangeAction({
        startDate: ranges.selection.startDate,
        endDate: ranges.selection.endDate,
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return;

    try {
      setDeleting(true);
      const concurrencyStamp = bannerToDelete.concurrency_stamp || bannerToDelete.concurrencyStamp;
      if (!concurrencyStamp) {
        showErrorToast('Concurrency stamp not found. Please refresh and try again.');
        return;
      }

      await deleteBanner(bannerToDelete.id, concurrencyStamp);
      showSuccessToast('Banner deleted successfully');
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
      tableHandlers.refresh();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error.message as string)
        : 'Failed to delete banner';
      
      if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
        showErrorToast('Concurrency error: Banner was modified by another user. Please refresh and try again.');
      } else {
        showErrorToast(errorMessage);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Banners
        </Typography>
        <Link to="/banners/new" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              textTransform: 'none',
              px: 3,
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            Add Banner
          </Button>
        </Link>
      </Box>

      {/* Unified Container for Search, Filters and Table */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}>
        {/* Search and Filter Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: 2,
          p: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <TextField
            id="banners-search"
            placeholder="Search banners..."
            variant="outlined"
            size="small"
            value={tableState.search}
            onChange={tableHandlers.handleSearch}
            sx={{
              flex: 1,
              minWidth: 280,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.default',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              onClick={(e) => setDateAnchorEl(e.currentTarget)}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                borderColor: 'divider', 
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              {format(dateRange[0].startDate || new Date(), 'MMM dd')} - {format(dateRange[0].endDate || new Date(), 'MMM dd')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                borderColor: 'divider', 
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              Advanced Search
            </Button>
          </Box>
        </Box>

        <Popover
          open={Boolean(dateAnchorEl)}
          anchorEl={dateAnchorEl}
          onClose={() => setDateAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box sx={{ p: 1 }}>
            <DateRangePicker
              ranges={dateRange}
              onChange={handleDateSelect}
              moveRangeOnFirstSelection={false}
            />
          </Box>
        </Popover>

        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 3, width: 300 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Banners</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={advancedFilters.status}
                label="Status"
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Vendor ID"
              value={advancedFilters.vendorId}
              onChange={(e) => setAdvancedFilters({ ...advancedFilters, vendorId: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Branch ID"
              value={advancedFilters.branchId}
              onChange={(e) => setAdvancedFilters({ ...advancedFilters, branchId: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Subcategory ID"
              value={advancedFilters.subCategoryId}
              onChange={(e) => setAdvancedFilters({ ...advancedFilters, subCategoryId: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
              <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
            </Box>
          </Box>
        </Popover>

        {/* Data Table Section */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <DataTable 
            key={`banner-table-${paginationModel.page}-${paginationModel.pageSize}`}
            columns={columns} 
            state={tableState} 
            handlers={tableHandlers} 
          />
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Banner</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this banner? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
