import React from 'react';
import { Box, Typography, Button, Avatar, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DataTable from '../../components/DataTable';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import ListPageLayout from '../../components/ListPageLayout';
import { useServerPagination } from '../../hooks/useServerPagination';
import { useListPageDateRange } from '../../hooks/useListPageDateRange';
import { fetchCategories, updateCategory } from '../../services/category.service';
import type { Category } from '../../types/category';
import type { ServerFilter } from '../../types/filter';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { CATEGORY_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function CategoryPage() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    const { dateRange, handleDateRangeApply: baseHandleDateRangeApply } = useListPageDateRange(30);
    const [updatingCategoryId, setUpdatingCategoryId] = React.useState<number | null>(null);
    const refreshTableRef = React.useRef<() => void>(() => {});

    const handleToggleStatus = React.useCallback(async (row: Category) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const concurrencyStamp = row.concurrencyStamp ?? (row as Category & { concurrency_stamp?: string }).concurrency_stamp ?? '';
        if (!concurrencyStamp) {
            showErrorToast('Cannot toggle: missing concurrency stamp.');
            return;
        }
        const userId = user?.id;
        if (userId == null) {
            showErrorToast('User not found.');
            return;
        }
        setUpdatingCategoryId(row.id);
        try {
            await updateCategory(row.id, {
                title: row.title,
                description: row.description ?? '',
                updatedBy: userId,
                concurrencyStamp,
                status: newStatus,
            });
            showSuccessToast(`Category set to ${newStatus}.`);
            refreshTableRef.current();
        } catch {
            showErrorToast('Failed to update category status.');
        } finally {
            setUpdatingCategoryId(null);
        }
    }, [user?.id]);

    const columns = [
        { id: 'image' as keyof Category, label: 'Image', minWidth: 80, render: (row: Category) => <Avatar src={row.image} alt={row.title} variant="rounded" sx={{ width: 50, height: 50 }} /> },
        {
            id: 'title' as keyof Category,
            label: 'Category',
            minWidth: 150,
            render: (row: Category) => (
                <Typography component="button" onClick={() => navigate(`/category/detail/${row.id}`)} sx={{ background: 'none', border: 'none', color: '#204564', cursor: 'pointer', textAlign: 'left', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {row.title}
                </Typography>
            ),
        },
        { id: 'description' as keyof Category, label: 'Description', minWidth: 200 },
        { id: 'status' as keyof Category, label: 'Status', minWidth: 100 },
        {
            id: 'action' as keyof Category,
            label: 'Action',
            minWidth: 80,
            align: 'center' as const,
            render: (row: Category) => (
                <RowActionsMenu<Category>
                    row={row}
                    ariaLabel="Category actions"
                    items={(r): RowActionItem<Category>[] => [
                        { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: (c) => navigate(`/category/detail/${c.id}`) },
                        { type: 'item', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: (c) => navigate(`/category/edit/${c.id}`) },
                        { type: 'divider' },
                        { type: 'item', label: r.status === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />, onClick: (c) => handleToggleStatus(c), disabled: updatingCategoryId === r.id },
                    ]}
                />
            )
        },
    ];

    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    type AdvancedFiltersState = { status: string };
    const emptyAdvancedFilters: AdvancedFiltersState = { status: '' };
    const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);

    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: { status: appliedAdvancedFilters.status || undefined },
            filterMappings: { status: { field: 'status', operator: 'eq' } },
        });
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

    const { paginationModel, setPaginationModel, setFilters, setSearchKeyword, tableState, tableHandlers } = useServerPagination<Category>({
        fetchFunction: fetchCategories,
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

    const handleDateRangeApply = (newRange: Parameters<typeof baseHandleDateRangeApply>[0]) => {
        baseHandleDateRangeApply(newRange);
    };

    return (
        <ListPageLayout
            title="Categories"
            addButton={{ to: '/category/new', label: 'Add Category' }}
            searchId="category-search"
            searchPlaceholder="Search categories..."
            searchValue={tableState.search}
            onSearchChange={tableHandlers.handleSearch}
            onClearAndRefresh={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeApply}
            onRefresh={() => tableHandlers.refresh()}
            filterAnchorEl={filterAnchorEl}
            onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
            onFilterClose={() => setFilterAnchorEl(null)}
            filterPopoverTitle="Filter Categories"
            filterPopoverContent={
                <>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={advancedFilters.status} label="Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {CATEGORY_STATUS_OPTIONS.map((option) => (
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
            <DataTable key={`category-table-${paginationModel.page}-${paginationModel.pageSize}`} columns={columns} state={tableState} paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} />
        </ListPageLayout>
    );
}
