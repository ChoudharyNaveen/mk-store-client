import React, { useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DataTable from '../../components/DataTable';
import SearchField from '../../components/SearchField';
import RowActionsMenu from '../../components/RowActionsMenu';
import type { RowActionItem } from '../../components/RowActionsMenu';
import { useServerPagination } from '../../hooks/useServerPagination';
import { getProductTypes, updateProductType } from '../../services/product-type.service';
import type { FetchParams } from '../../services/product-type.service';
import type { ServerPaginationResponse } from '../../hooks/useServerPagination';
import type { ProductType } from '../../types/product-type';
import { useAppSelector } from '../../store/hooks';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function ProductTypeList() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [updatingId, setUpdatingId] = React.useState<number | null>(null);
  const refreshTableRef = useRef<() => void>(() => {});

  const fetchProductTypesForTable = useCallback(
    async (params: FetchParams): Promise<ServerPaginationResponse<ProductType>> => {
      const res = await getProductTypes({
        page: params.page ?? 0,
        pageSize: params.pageSize ?? 10,
        searchKeyword: params.searchKeyword,
        filters: params.filters,
        sorting: params.sorting,
        signal: params.signal,
      });
      return {
        list: res.list,
        totalCount: res.totalCount,
        pageDetails: res.pageDetails,
      };
    },
    []
  );

  const {
    paginationModel,
    setPaginationModel,
    tableState,
    tableHandlers,
  } = useServerPagination<ProductType>({
    fetchFunction: fetchProductTypesForTable,
    initialPageSize: 20,
    enabled: true,
    autoFetch: true,
    filters: {},
    initialSorting: [{ key: 'title', direction: 'ASC' }],
    searchDebounceMs: 500,
  });

  refreshTableRef.current = tableHandlers.refresh;

  const handleToggleStatus = useCallback(
    async (row: ProductType) => {
      const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
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
      setUpdatingId(row.id);
      try {
        await updateProductType(row.id, {
          title: row.title,
          status: newStatus,
          updatedBy: userId,
          concurrencyStamp,
        });
        showSuccessToast(`Product type set to ${newStatus}.`);
        refreshTableRef.current();
      } catch {
        showErrorToast('Failed to update product type status.');
      } finally {
        setUpdatingId(null);
      }
    },
    [user?.id]
  );

  const columns = [
    // { id: 'id' as keyof ProductType, label: 'ID', minWidth: 80 },
    { id: 'title' as keyof ProductType, label: 'Title', minWidth: 180 },
    {
      id: 'subCategory' as keyof ProductType,
      label: 'Sub Category',
      minWidth: 160,
      render: (row: ProductType) => row.subCategory?.title ?? '—',
    },
    {
      id: 'status' as keyof ProductType,
      label: 'Status',
      minWidth: 100,
      align: 'center' as const,
      render: (row: ProductType) => (
        <Chip
          label={row.status}
          size="small"
          color={row.status === 'ACTIVE' ? 'success' : 'default'}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      id: 'action' as keyof ProductType,
      label: 'Action',
      minWidth: 80,
      align: 'center' as const,
      render: (row: ProductType) => (
        <RowActionsMenu<ProductType>
          row={row}
          ariaLabel="Product type actions"
          items={(r): RowActionItem<ProductType>[] => [
            { type: 'item', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: (pt) => navigate(`/product-types/edit/${pt.id}`) },
            { type: 'divider' },
            { type: 'item', label: r.status === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />, onClick: (pt) => handleToggleStatus(pt), disabled: updatingId === r.id },
          ]}
        />
      ),
    },
  ];

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Product Types
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/product-types/new')}
          sx={{ textTransform: 'none' }}
        >
          Add Product Type
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          overflow: 'hidden',
        }}
      >
        <SearchField
          placeholder="Search by title..."
          value={tableState.search}
          onChange={tableHandlers.handleSearch}
          onClearAndRefresh={tableHandlers.refresh}
          sx={{ minWidth: 220 }}
        />
        <IconButton size="small" onClick={() => tableHandlers.refresh()} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      <DataTable
        columns={columns}
        state={tableState}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        emptyStateMessage="No product types yet"
        emptyStateActionLabel="Add Product Type"
        emptyStateActionOnClick={() => navigate('/product-types/new')}
      />
    </Paper>
  );
}
