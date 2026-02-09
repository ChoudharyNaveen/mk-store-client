import React from 'react';
import { Box, Typography, Button, Avatar, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
import { fetchOffers, updateOffer } from '../../services/offer.service';
import type { Offer } from '../../types/offer';
import type { ServerFilter } from '../../types/filter';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector } from '../../store/hooks';
import { OFFER_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function OfferList() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    const { dateRange, handleDateRangeApply } = useListPageDateRange(30);
    const [updatingOfferId, setUpdatingOfferId] = React.useState<number | null>(null);
    const refreshTableRef = React.useRef<() => void>(() => {});

    const handleToggleStatus = React.useCallback(async (row: Offer) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const concurrencyStamp = row.concurrency_stamp ?? (row as Offer & { concurrencyStamp?: string }).concurrencyStamp ?? '';
        if (!concurrencyStamp) {
            showErrorToast('Cannot toggle: missing concurrency stamp.');
            return;
        }
        const userId = user?.id;
        if (userId == null) {
            showErrorToast('User not found.');
            return;
        }
        setUpdatingOfferId(row.id);
        try {
            await updateOffer(row.id, { concurrency_stamp: concurrencyStamp, status: newStatus, updated_by: userId });
            showSuccessToast(`Offer set to ${newStatus}.`);
            refreshTableRef.current();
        } catch {
            showErrorToast('Failed to update offer status.');
        } finally {
            setUpdatingOfferId(null);
        }
    }, [user?.id]);

    const columns = [
        { id: 'image' as keyof Offer, label: 'Image', minWidth: 80, render: (row: Offer) => <Avatar src={row.image && row.image !== 'NA' ? row.image : undefined} alt={row.code} variant="rounded" sx={{ width: 50, height: 50 }} /> },
        {
            id: 'code' as keyof Offer,
            label: 'Code',
            minWidth: 100,
            render: (row: Offer) => (
                <Typography component="button" onClick={() => navigate(`/offers/detail/${row.id}`)} sx={{ background: 'none', border: 'none', color: 'primary.main', cursor: 'pointer', textAlign: 'left', p: 0, font: 'inherit', '&:hover': { textDecoration: 'underline' } }}>
                    {row.code}
                </Typography>
            ),
        },
        { id: 'description' as keyof Offer, label: 'Description', minWidth: 200 },
        { id: 'percentage' as keyof Offer, label: 'Percentage', minWidth: 100 },
        { id: 'start_date' as keyof Offer, label: 'Start Date', minWidth: 120, render: (row: Offer) => format(new Date(row.start_date), 'MMM dd, yyyy') },
        { id: 'end_date' as keyof Offer, label: 'End Date', minWidth: 120, render: (row: Offer) => format(new Date(row.end_date), 'MMM dd, yyyy') },
        { id: 'status' as keyof Offer, label: 'Status', minWidth: 100 },
        { id: 'createdAt' as keyof Offer, label: 'Created Date', minWidth: 120, render: (row: Offer) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
        {
            id: 'action' as keyof Offer,
            label: 'Action',
            minWidth: 80,
            align: 'center' as const,
            render: (row: Offer) => (
                <RowActionsMenu<Offer>
                    row={row}
                    ariaLabel="Offer actions"
                    items={(r): RowActionItem<Offer>[] => [
                        { type: 'item', label: 'View', icon: <VisibilityIcon fontSize="small" />, onClick: (o) => navigate(`/offers/detail/${o.id}`) },
                        { type: 'item', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: (o) => navigate(`/offers/edit/${o.id}`) },
                        { type: 'divider' },
                        { type: 'item', label: r.status === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />, onClick: (o) => handleToggleStatus(o), disabled: updatingOfferId === r.id },
                    ]}
                />
            )
        },
    ];

    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const emptyAdvancedFilters = { percentage: '', status: '' };
    const [advancedFilters, setAdvancedFilters] = React.useState(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState(emptyAdvancedFilters);

    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: appliedAdvancedFilters,
            filterMappings: { percentage: { field: 'percentage', operator: 'eq' }, status: { field: 'status', operator: 'eq' } },
        });
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

    const { paginationModel, setPaginationModel, setFilters, setSearchKeyword, tableState, tableHandlers } = useServerPagination<Offer>({
        fetchFunction: fetchOffers,
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
            title="Offers"
            addButton={{ to: '/offers/new', label: 'Add Offer' }}
            searchId="offers-search"
            searchPlaceholder="Search offers..."
            searchValue={tableState.search}
            onSearchChange={tableHandlers.handleSearch}
            onClearAndRefresh={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeApply}
            onRefresh={() => tableHandlers.refresh()}
            filterAnchorEl={filterAnchorEl}
            onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
            onFilterClose={() => setFilterAnchorEl(null)}
            filterPopoverTitle="Filter Offers"
            filterPopoverContent={
                <>
                    <TextField fullWidth size="small" label="Percentage" type="number" value={advancedFilters.percentage} onChange={(e) => setAdvancedFilters({ ...advancedFilters, percentage: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={advancedFilters.status} label="Status" onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}>
                            <MenuItem value="">All</MenuItem>
                            {OFFER_STATUS_OPTIONS.map((option) => (
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
            <DataTable key={`offer-table-${paginationModel.page}-${paginationModel.pageSize}`} columns={columns} state={tableState} handlers={tableHandlers} />
        </ListPageLayout>
    );
}
