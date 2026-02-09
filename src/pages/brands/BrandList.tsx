import React from 'react';
import { Box, Typography, Button, Avatar, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
import { fetchBrands, updateBrand } from '../../services/brand.service';
import type { Brand } from '../../types/brand';
import type { ServerFilter } from '../../types/filter';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { BRAND_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function BrandList() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    const { dateRange, handleDateRangeApply } = useListPageDateRange(30);
    const [updatingBrandId, setUpdatingBrandId] = React.useState<number | null>(null);
    const refreshTableRef = React.useRef<() => void>(() => {});

    const handleToggleStatus = React.useCallback(async (row: Brand) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const concurrencyStamp = row.concurrencyStamp ?? (row as Brand & { concurrency_stamp?: string }).concurrency_stamp ?? '';
        if (!concurrencyStamp) {
            showErrorToast('Cannot toggle: missing concurrency stamp.');
            return;
        }
        const userId = user?.id;
        if (userId == null) {
            showErrorToast('User not found.');
            return;
        }
        setUpdatingBrandId(row.id);
        try {
            await updateBrand(row.id, {
                name: row.name,
                description: row.description ?? '',
                updatedBy: userId,
                concurrencyStamp,
                status: newStatus,
            });
            showSuccessToast(`Brand set to ${newStatus}.`);
            refreshTableRef.current();
        } catch {
            showErrorToast('Failed to update brand status.');
        } finally {
            setUpdatingBrandId(null);
        }
    }, [user?.id]);

    const columns = [
        {
            id: 'logo' as keyof Brand,
            label: 'Logo',
            minWidth: 80,
            render: (row: Brand) => {
                const logoUrl = row.logo || row.image;
                return logoUrl ? (
                    <Avatar src={logoUrl} alt={row.name} variant="rounded" sx={{ width: 50, height: 50 }} />
                ) : (
                    <Avatar variant="rounded" sx={{ width: 50, height: 50, bgcolor: 'primary.main', color: 'white', fontSize: '1.25rem', fontWeight: 600 }}>
                        {row.name?.charAt(0)?.toUpperCase() || 'B'}
                    </Avatar>
                );
            }
        },
        {
            id: 'name' as keyof Brand,
            label: 'Brand Name',
            minWidth: 150,
            render: (row: Brand) => (
                <Typography component="button" onClick={() => navigate(`/brands/detail/${row.id}`)} sx={{ background: 'none', border: 'none', color: 'primary.main', cursor: 'pointer', textAlign: 'left', p: 0, font: 'inherit', '&:hover': { textDecoration: 'underline' } }}>
                    {row.name}
                </Typography>
            ),
        },
        { id: 'description' as keyof Brand, label: 'Description', minWidth: 200 },
        { id: 'status' as keyof Brand, label: 'Status', minWidth: 100 },
        { id: 'createdAt' as keyof Brand, label: 'Created Date', minWidth: 120, render: (row: Brand) => row.createdAt ? format(new Date(row.createdAt), 'MMM dd, yyyy') : 'N/A' },
        {
            id: 'action' as keyof Brand,
            label: 'Action',
            minWidth: 80,
            align: 'center' as const,
            render: (row: Brand) => (
                <RowActionsMenu<Brand>
                    row={row}
                    ariaLabel="Brand actions"
                    items={(r): RowActionItem<Brand>[] => [
                        { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: (b) => navigate(`/brands/detail/${b.id}`) },
                        { type: 'item', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: (b) => navigate(`/brands/edit/${b.id}`) },
                        { type: 'divider' },
                        { type: 'item', label: r.status === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />, onClick: (b) => handleToggleStatus(b), disabled: updatingBrandId === r.id },
                    ]}
                />
            )
        },
    ];

    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const emptyAdvancedFilters = { status: '' };
    const [advancedFilters, setAdvancedFilters] = React.useState(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState(emptyAdvancedFilters);

    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: appliedAdvancedFilters,
            filterMappings: { status: { field: 'status', operator: 'eq' } },
        });
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

    const { paginationModel, setPaginationModel, setFilters, setSearchKeyword, tableState, tableHandlers } = useServerPagination<Brand>({
        fetchFunction: fetchBrands,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: buildFilters(),
        initialSorting: [{ key: 'createdAt', direction: 'DESC' }],
        searchDebounceMs: 500,
    });

    refreshTableRef.current = tableHandlers.refresh;

    React.useEffect(() => {
        setFilters(buildFilters());
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [appliedAdvancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    React.useEffect(() => {
        if (filterAnchorEl) setAdvancedFilters(appliedAdvancedFilters);
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

    return (
        <ListPageLayout
            title="Brands"
            addButton={{ to: '/brands/new', label: 'Add Brand' }}
            searchId="brands-search"
            searchPlaceholder="Search brands..."
            searchValue={tableState.search}
            onSearchChange={tableHandlers.handleSearch}
            onClearAndRefresh={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeApply}
            onRefresh={() => tableHandlers.refresh()}
            filterAnchorEl={filterAnchorEl}
            onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
            onFilterClose={() => setFilterAnchorEl(null)}
            filterPopoverTitle="Filter Brands"
            filterPopoverContent={
                <>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={advancedFilters.status} label="Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {BRAND_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </>
            }
        >
            <DataTable key={`brand-table-${paginationModel.page}-${paginationModel.pageSize}`} columns={columns} state={tableState} handlers={tableHandlers} />
        </ListPageLayout>
    );
}
