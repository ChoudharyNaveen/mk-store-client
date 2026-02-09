import React from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
import promocodeService, { fetchPromocodes } from '../../services/promo-code.service';
import type { Promocode } from '../../types/promo-code';
import type { ServerFilter } from '../../types/filter';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { PROMOCODE_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function PromocodeList() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    const { dateRange, handleDateRangeApply } = useListPageDateRange(30);
    const [updatingPromocodeId, setUpdatingPromocodeId] = React.useState<number | null>(null);
    const refreshTableRef = React.useRef<() => void>(() => {});

    const handleToggleStatus = React.useCallback(async (row: Promocode) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const concurrencyStamp = row.concurrency_stamp ?? (row as Promocode & { concurrencyStamp?: string }).concurrencyStamp ?? '';
        if (!concurrencyStamp) {
            showErrorToast('Cannot toggle: missing concurrency stamp.');
            return;
        }
        const userId = user?.id;
        if (userId == null) {
            showErrorToast('User not found.');
            return;
        }
        setUpdatingPromocodeId(row.id);
        try {
            await promocodeService.updatePromocode(row.id, { concurrency_stamp: concurrencyStamp, status: newStatus, updated_by: userId });
            showSuccessToast(`Promocode set to ${newStatus}.`);
            refreshTableRef.current();
        } catch {
            showErrorToast('Failed to update promocode status.');
        } finally {
            setUpdatingPromocodeId(null);
        }
    }, [user?.id]);

    const columns = [
        { id: 'type' as keyof Promocode, label: 'Type', minWidth: 100 },
        {
            id: 'code' as keyof Promocode,
            label: 'Code',
            minWidth: 120,
            render: (row: Promocode) => (
                <Typography component="button" onClick={() => navigate(`/promo-code/detail/${row.id}`)} sx={{ background: 'none', border: 'none', color: 'primary.main', cursor: 'pointer', textAlign: 'left', p: 0, font: 'inherit', '&:hover': { textDecoration: 'underline' } }}>
                    {row.code}
                </Typography>
            ),
        },
        { id: 'percentage' as keyof Promocode, label: 'Percentage', minWidth: 100 },
        { id: 'start_date' as keyof Promocode, label: 'Start Date', minWidth: 120, render: (row: Promocode) => format(new Date(row.start_date), 'MMM dd, yyyy') },
        { id: 'end_date' as keyof Promocode, label: 'End Date', minWidth: 120, render: (row: Promocode) => format(new Date(row.end_date), 'MMM dd, yyyy') },
        { id: 'status' as keyof Promocode, label: 'Status', minWidth: 100 },
        { id: 'createdAt' as keyof Promocode, label: 'Created Date', minWidth: 120, render: (row: Promocode) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
        {
            id: 'action' as keyof Promocode,
            label: 'Action',
            minWidth: 80,
            align: 'center' as const,
            render: (row: Promocode) => (
                <RowActionsMenu<Promocode>
                    row={row}
                    ariaLabel="Promo code actions"
                    items={(r): RowActionItem<Promocode>[] => [
                        { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: (p) => navigate(`/promo-code/detail/${p.id}`) },
                        { type: 'item', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: (p) => navigate(`/promo-code/edit/${p.id}`) },
                        { type: 'divider' },
                        { type: 'item', label: r.status === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />, onClick: (p) => handleToggleStatus(p), disabled: updatingPromocodeId === r.id },
                    ]}
                />
            )
        },
    ];

    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const emptyAdvancedFilters = { code: '', type: '', status: '' };
    const [advancedFilters, setAdvancedFilters] = React.useState(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState(emptyAdvancedFilters);

    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: appliedAdvancedFilters,
            filterMappings: { code: { field: 'code', operator: 'iLike' }, type: { field: 'type', operator: 'eq' }, status: { field: 'status', operator: 'eq' } },
        });
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

    const { paginationModel, setPaginationModel, setFilters, setSearchKeyword, tableState, tableHandlers } = useServerPagination<Promocode>({
        fetchFunction: fetchPromocodes,
        initialPageSize: 10,
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
            title="Promocodes"
            addButton={{ to: '/promo-code/new', label: 'Add Promocode' }}
            searchId="promocode-search"
            searchPlaceholder="Search promocodes..."
            searchValue={tableState.search}
            onSearchChange={tableHandlers.handleSearch}
            onClearAndRefresh={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeApply}
            onRefresh={() => tableHandlers.refresh()}
            filterAnchorEl={filterAnchorEl}
            onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
            onFilterClose={() => setFilterAnchorEl(null)}
            filterPopoverTitle="Filter Promocodes"
            filterPopoverContent={
                <>
                    <TextField fullWidth size="small" label="Code" value={advancedFilters.code} onChange={(e) => setAdvancedFilters({ ...advancedFilters, code: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth size="small" label="Type" value={advancedFilters.type} onChange={(e) => setAdvancedFilters({ ...advancedFilters, type: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={advancedFilters.status} label="Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {PROMOCODE_STATUS_OPTIONS.map((option) => (
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
            <DataTable key={`promocode-table-${paginationModel.page}-${paginationModel.pageSize}`} columns={columns} state={tableState} handlers={tableHandlers} />
        </ListPageLayout>
    );
}
