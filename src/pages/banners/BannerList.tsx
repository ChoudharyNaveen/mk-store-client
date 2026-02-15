import React from 'react';
import { Box, Typography, Button, TextField, Chip, Select, MenuItem, FormControl, InputLabel, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import ListPageLayout from '../../components/ListPageLayout';
import { useServerPagination } from '../../hooks/useServerPagination';
import { useListPageDateRange } from '../../hooks/useListPageDateRange';
import { fetchBanners, updateBanner } from '../../services/banner.service';
import { fetchSubCategories } from '../../services/sub-category.service';
import type { Banner } from '../../types/banner';
import type { SubCategory } from '../../types/sub-category';
import type { ServerFilter } from '../../types/filter';
import type { Column } from '../../types/table';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
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
  const { dateRange, handleDateRangeApply } = useListPageDateRange(30);
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
  
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);

  const [subCategories, setSubCategories] = React.useState<SubCategory[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = React.useState(false);
  const filterOptionsLoadedRef = React.useRef(false);

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

  const {
    paginationModel,
    setPaginationModel,
    setFilters,
    setSearchKeyword,
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

  // Update filters when applied filters or date range change (same pattern as SubCategoryList)
  React.useEffect(() => {
    setFilters(buildFilters());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [appliedAdvancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

  React.useEffect(() => {
    if (filterAnchorEl) {
      setAdvancedFilters(appliedAdvancedFilters);
    }
  }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    setAppliedAdvancedFilters(advancedFilters);
    setFilterAnchorEl(null);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setAdvancedFilters(emptyAdvancedFilters);
    setAppliedAdvancedFilters(emptyAdvancedFilters);
    setFilterAnchorEl(null);
  };

  const handleClearSearchAndRefresh = () => {
    setSearchKeyword('');
    setAdvancedFilters(emptyAdvancedFilters);
    setAppliedAdvancedFilters(emptyAdvancedFilters);
    setFilterAnchorEl(null);
    // Effect runs (appliedAdvancedFilters changed) → setFilters + setPaginationModel → hook's filters effect fetches once; search skip ref prevents second fetch
  };

  return (
    <>
      <ListPageLayout
        title="Banners"
        addButton={{ to: '/banners/new', label: 'Add Banner' }}
        searchId="banners-search"
        searchPlaceholder="Search banners..."
        searchValue={tableState.search}
        onSearchChange={tableHandlers.handleSearch}
        onClearAndRefresh={handleClearSearchAndRefresh}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeApply}
        onRefresh={() => tableHandlers.refresh()}
        filterAnchorEl={filterAnchorEl}
        onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
        onFilterClose={() => setFilterAnchorEl(null)}
        filterPopoverTitle="Filter Banners"
        filterPopoverWidth={320}
        filterPopoverContent={
          <>
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
              <Select value={advancedFilters.status} label="Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
              <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
            </Box>
          </>
        }
      >
        <DataTable key={`banner-table-${paginationModel.page}-${paginationModel.pageSize}`} columns={columns} state={tableState} paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} />
      </ListPageLayout>

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
    </>
  );
}
