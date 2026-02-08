import React from 'react';
import { Box, Typography, Button, TextField, Popover, IconButton, Paper, Chip, Select,
   MenuItem, FormControl, InputLabel, Avatar, Dialog, DialogTitle, DialogContent,
    DialogActions, Tooltip, Autocomplete, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import DateRangePopover from '../../components/DateRangePopover';
import type { DateRangeSelection } from '../../components/DateRangePopover';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchBanners, updateBanner } from '../../services/banner.service';
import { fetchSubCategories } from '../../services/sub-category.service';
import type { Banner } from '../../types/banner';
import type { SubCategory } from '../../types/sub-category';
import type { ServerFilter } from '../../types/filter';
import type { Column } from '../../types/table';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

type AdvancedFiltersState = {
  status: string;
  subCategoryIds: number[];
};
const emptyAdvancedFilters: AdvancedFiltersState = {
  status: '',
  subCategoryIds: [],
};

export default function BannerList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get date range from store, or use default
  const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
  const storeEndDate = useAppSelector((state) => state.dateRange.endDate);
  
  // View banner image dialog state
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [bannerToView, setBannerToView] = React.useState<Banner | null>(null);

  const columns: Column<Banner>[] = [
    {
      id: 'image_url' as keyof Banner,
      label: 'Image',
      minWidth: 100,
      render: (row: Banner) => {
        const imageUrl = row.image_url;
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
      render: (row: Banner) => row.display_order ?? 0
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
      minWidth: 80,
      align: 'center' as const,
      render: (row: Banner) => (
        <RowActionsMenu<Banner>
          row={row}
          ariaLabel="Banner actions"
          items={(r): RowActionItem<Banner>[] => [
            { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: (b) => { setBannerToView(b); setViewDialogOpen(true); } },
            { type: 'item', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: (b) => navigate(`/banners/edit/${b.id}`) },
            { type: 'divider' },
            { type: 'item', label: r.status === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />, onClick: (b) => handleToggleStatus(b), disabled: updatingBannerId === r.id },
          ]}
        />
      )
    },
  ];
  
  const [dateRange, setDateRange] = React.useState<DateRangeSelection>(() => {
    if (storeStartDate && storeEndDate) {
      return [{
        startDate: new Date(storeStartDate),
        endDate: new Date(storeEndDate),
        key: 'selection'
      }];
    }
    return getLastNDaysRangeForDatePicker(30);
  });
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);

  const [subCategories, setSubCategories] = React.useState<SubCategory[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = React.useState(false);
  const filterOptionsLoadedRef = React.useRef(false);
  const hasSyncedFiltersOnceRef = React.useRef(false);

  const { user } = useAppSelector((state) => state.auth);
  const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
  const vendorId = user?.vendorId;

  const [updatingBannerId, setUpdatingBannerId] = React.useState<number | null>(null);
  const refreshTableRef = React.useRef<() => void>(() => {});

  const handleToggleStatus = React.useCallback(async (row: Banner) => {
    const newStatus = (row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as Banner['status'];
    const concurrencyStamp = row.concurrencyStamp ?? row.concurrency_stamp ?? '';
    if (!concurrencyStamp) {
      showErrorToast('Cannot toggle: missing concurrency stamp.');
      return;
    }
    const userId = user?.id;
    if (userId == null) {
      showErrorToast('User not found.');
      return;
    }
    setUpdatingBannerId(row.id);
    try {
      await updateBanner(row.id, {
        updatedBy: userId,
        concurrencyStamp,
        status: newStatus,
      });
      showSuccessToast(`Banner set to ${newStatus}.`);
      refreshTableRef.current();
    } catch {
      showErrorToast('Failed to update banner status.');
    } finally {
      setUpdatingBannerId(null);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (!filterAnchorEl || filterOptionsLoadedRef.current) return;
    let cancelled = false;
    const loadOptions = async () => {
      setLoadingSubCategories(true);
      try {
        const res = await fetchSubCategories({ page: 0, pageSize: 500, filters: [] });
        if (!cancelled) {
          setSubCategories(res.list || []);
          filterOptionsLoadedRef.current = true;
        }
      } catch (err) {
        if (!cancelled) console.error('Error loading subcategories:', err);
      } finally {
        if (!cancelled) setLoadingSubCategories(false);
      }
    };
    loadOptions();
    return () => { cancelled = true; };
  }, [filterAnchorEl]);

  // Helper function to build filters array (uses applied filters; no default vendor/branch filters)
  const buildFilters = React.useCallback((): ServerFilter[] => {
    const applied = appliedAdvancedFilters;
    const advancedFiltersForBuild: Record<string, string | number[] | undefined> = {
      status: applied.status || undefined,
      subCategoryIds: applied.subCategoryIds?.length ? applied.subCategoryIds : undefined,
    };
    const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: 'created_at',
      advancedFilters: advancedFiltersForBuild,
      filterMappings: {
        status: { field: 'status', operator: 'eq' },
        subCategoryIds: { field: 'sub_category_id', operator: 'in' },
      },
    });
    return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
  }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

  // Use server pagination hook
  const {
    paginationModel,
    setPaginationModel,
    setFilters,
    fetchData,
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

  refreshTableRef.current = tableHandlers.refresh;

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

  // Update filters when applied filters or date range change (Apply updates applied; don't refetch on every form change).
  // Skip first run to avoid triggering a second fetch on mount (hook already has initial filters from config).
  React.useEffect(() => {
    if (!hasSyncedFiltersOnceRef.current) {
      hasSyncedFiltersOnceRef.current = true;
      return;
    }
    setFilters(buildFilters());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [appliedAdvancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

  React.useEffect(() => {
    if (filterAnchorEl) {
      setAdvancedFilters(appliedAdvancedFilters);
    }
  }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    const pending = advancedFilters;
    setAppliedAdvancedFilters(pending);
    const advancedFiltersForBuild: Record<string, string | number[] | undefined> = {
      status: pending.status || undefined,
      subCategoryIds: pending.subCategoryIds?.length ? pending.subCategoryIds : undefined,
    };
    const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: 'created_at',
      advancedFilters: advancedFiltersForBuild,
      filterMappings: {
        status: { field: 'status', operator: 'eq' },
        subCategoryIds: { field: 'sub_category_id', operator: 'in' },
      },
    });
    const filtersToApply = mergeWithDefaultFilters(additionalFilters, undefined, undefined);
    setFilters(filtersToApply);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
  };

  const handleClearFilters = () => {
    setAdvancedFilters(emptyAdvancedFilters);
    setAppliedAdvancedFilters(emptyAdvancedFilters);
    const emptyForBuild: Record<string, string | number[] | undefined> = {
      status: undefined,
      subCategoryIds: undefined,
    };
    const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: 'created_at',
      advancedFilters: emptyForBuild,
      filterMappings: {
        status: { field: 'status', operator: 'eq' },
        subCategoryIds: { field: 'sub_category_id', operator: 'in' },
      },
    });
    const filtersToApply = mergeWithDefaultFilters(additionalFilters, undefined, undefined);
    setFilters(filtersToApply);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setFilterAnchorEl(null);
    fetchData({ force: true, initialFetch: true, filters: filtersToApply });
  };

  const handleDateRangeApply = (newRange: DateRangeSelection) => {
    setDateRange(newRange);
    const range = newRange?.[0];
    if (range) {
      dispatch(setDateRangeAction({ startDate: range.startDate, endDate: range.endDate }));
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
        {/* Filter Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: 2,
          p: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <DateRangePopover value={dateRange} onChange={handleDateRangeApply} />
            <Tooltip title="Refresh table">
              <IconButton
                onClick={() => tableHandlers.refresh()}
                size="small"
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover', color: 'primary.main' },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
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
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 3, width: 320 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Banners</Typography>
            <Autocomplete
              multiple
              size="small"
              options={subCategories}
              getOptionLabel={(option) => (typeof option === 'object' && option?.title) ? option.title : ''}
              value={subCategories.filter((s) => advancedFilters.subCategoryIds.includes(s.id))}
              onChange={(_, newValue) => setAdvancedFilters({ ...advancedFilters, subCategoryIds: newValue.map((s) => s.id) })}
              loading={loadingSubCategories}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subcategories"
                  placeholder={advancedFilters.subCategoryIds.length ? '' : 'Select subcategories'}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingSubCategories ? <CircularProgress size={20} color="inherit" /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />
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

      {/* View Banner Image Dialog - full XL */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, maxHeight: '90vh' },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>Banner Preview</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: 320 }}>
          {bannerToView && (
            <Box
              component="img"
              src={bannerToView.image_url || (bannerToView as Banner & { imageUrl?: string }).imageUrl}
              alt="Banner"
              sx={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 1,
                boxShadow: 2,
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
