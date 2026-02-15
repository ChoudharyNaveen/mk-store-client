'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Pagination, Select, MenuItem, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridSortModel,
    useGridApiContext,
    useGridRootProps,
    useGridSelector,
    gridPaginationModelSelector,
    gridPaginationRowCountSelector,
    gridPageCountSelector,
} from '@mui/x-data-grid';
import type { GridPaginationModel, GridRowHeightReturnValue } from '@mui/x-data-grid';
import type { GridRowParams, GridValidRowModel } from '@mui/x-data-grid';
import { Column, TableState } from '../types/table';

const hoverBg = (theme: { palette?: Record<string, { shades?: { A50?: string } }> }) =>
    theme?.palette?.Blue?.shades?.A50 ?? 'rgba(0, 0, 0, 0.04)';
const textColor = (theme: { palette: { primary?: { text?: string }; text?: { primary: string } } }) =>
    theme.palette.primary?.text ?? theme.palette.text?.primary ?? '#000000';

export const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    backgroundColor: 'transparent',

    '& .MuiDataGrid-columnHeaderTitle': {
        fontSize: '12px !important',
        fontWeight: '600 !important',
        color: textColor(theme as unknown as Parameters<typeof textColor>[0]),
        textTransform: 'uppercase',
        textAlign: 'left',
    },

    '& .MuiDataGrid-columnHeader': {
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start !important',
    },

    '& .MuiDataGrid-cell': {
        fontSize: '0.875rem !important',
        fontWeight: '400 !important',
        color: textColor(theme as unknown as Parameters<typeof textColor>[0]),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start !important',
        textAlign: 'left !important',
    },
    '& .MuiDataGrid-row': {
        '&:nth-of-type(odd) .MuiDataGrid-cell, &:nth-of-type(odd) .MuiDataGrid-cell:nth-last-of-type(1)': {
            backgroundColor: '#ffffff',
        },
        '&:nth-of-type(even) .MuiDataGrid-cell, &:nth-of-type(even) .MuiDataGrid-cell:nth-last-of-type(1)': {
            backgroundColor: '#f6f6f6',
        },
        '&:nth-of-type(odd) .MuiDataGrid-cell:nth-of-type(2), &:nth-of-type(odd) .MuiDataGrid-cell.MuiDataGrid-cellCheckbox + .MuiDataGrid-cell': {
            backgroundColor: '#ffffff',
        },
        '&:nth-of-type(even) .MuiDataGrid-cell:nth-of-type(2), &:nth-of-type(even) .MuiDataGrid-cell.MuiDataGrid-cellCheckbox + .MuiDataGrid-cell': {
            backgroundColor: '#f6f6f6',
        },
    },
    '& .MuiDataGrid-row:hover': {
        backgroundColor: `${hoverBg(theme as unknown as Parameters<typeof hoverBg>[0])} !important`,
    },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell': {
        backgroundColor: `${hoverBg(theme as unknown as Parameters<typeof hoverBg>[0])} !important`,
    },
    '& .MuiCheckbox-root': {
        color: ' #44546F !important',
        fontSize: '0.688rem !important',
        fontWeight: '500 !important',
    },
    '& .MuiCheckbox-root:hover': {
        backgroundColor: 'transparent !important',
        boxShadow: 'none !important',
    },
    '& .MuiCheckbox-root.Mui-focusVisible': {
        backgroundColor: 'transparent !important',
    },
    '& .MuiCheckbox-root .MuiTouchRipple-root': {
        display: 'none !important',
    },
    '& .MuiDataGrid-scrollbar--horizontal': {
        bottom: '-3px !important',
    },
    '& .MuiCheckbox-root.Mui-checked': {
        color: `${theme.palette.primary.main} !important`,
    },
    '& .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell': {
        backgroundColor: '#D7E3FC !important',
        borderBottom: '1px solid rgba(9, 30, 66, 0.14) !important',
    },
    '& .MuiDataGrid-cellCheckbox': {
        padding: '0px !important',
    },
    '& .MuiDataGrid-columnHeaderCheckbox': {
        padding: '0px !important',
    },
    '& .MuiDataGrid-columnHeader:first-child': {
        paddingLeft: '0px !important',
    },
    '& .MuiDataGrid-cell:first-child': {
        paddingLeft: '0px !important',
    },
    '& .MuiDataGrid-row.Mui-selected:hover .MuiDataGrid-cell': {
        backgroundColor: '#B0C4F5 !important',
    },
    '& .css-1jlz3st': {
        display: 'none',
    },
}));

/** Custom pagination: rows-per-page select, "X–Y of Z", and MUI Pagination with first/last + page numbers (1, 2, 3...). */
function CustomGridPagination() {
    const apiRef = useGridApiContext();
    const rootProps = useGridRootProps();
    const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
    const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
    const pageCount = useGridSelector(apiRef, gridPageCountSelector);
    const rawOptions = rootProps.pageSizeOptions ?? [10, 20, 50, 100];
    const pageSizeOptions = rawOptions.map((o: number | { value: number }) =>
        typeof o === 'number' ? o : o.value,
    );

    const page = paginationModel.page;
    const pageSize = paginationModel.pageSize;
    const from = rowCount === 0 ? 0 : page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, rowCount === -1 ? (page + 1) * pageSize : rowCount);
    const count = rowCount === -1 ? 0 : rowCount;

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        apiRef.current.setPage(value - 1); // MUI Pagination is 1-based
    };

    const handlePageSizeChange = (event: { target: { value?: unknown } }) => {
        const newPageSize = Number(event.target.value);
        if (!Number.isNaN(newPageSize)) apiRef.current.setPageSize(newPageSize);
    };

    // Use actual page count from rowCount to avoid extra page (grid's pageCount returns page+2 when rowCount==-1)
    const paginationCount =
        rowCount >= 0 && pageSize > 0
            ? Math.max(1, Math.ceil(rowCount / pageSize))
            : rowCount === -1
              ? Math.max(1, page + 1) // unknown total: only show pages up to current + 1
              : Math.max(1, pageCount);

    if (rowCount >= 0 && rowCount <= 10) return null;

    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" flex={1} sx={{ px: 1, py: 0.5, width: '100%', flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" alignItems="center" gap={1}>
                <Select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    variant="outlined"
                    size="small"
                    sx={{
                        '& .MuiSelect-select': { py: 0.5, minHeight: 'auto' },
                    }}
                >
                    {pageSizeOptions.map((size) => (
                        <MenuItem key={size} value={size}>
                            {size}
                        </MenuItem>
                    ))}
                </Select>
                <Typography variant="body2" color="text.secondary">
                    {count === -1 ? `${from}–${to} of more than ${to}` : `${from}–${to} of ${count}`}
                </Typography>
            </Stack>
            <Pagination
                color="primary"
                variant="outlined"
                shape="rounded"
                showFirstButton
                showLastButton
                siblingCount={1}
                page={Math.min(page + 1, paginationCount)}
                count={paginationCount}
                onChange={handlePageChange}
            />
        </Stack>
    );
}

interface DataTableProps<T> {
    columns: Column<T>[];
    state: TableState<T>;
    /** When provided, pagination is controlled (server-side). When omitted, uses internal state (client-side). */
    paginationModel?: GridPaginationModel;
    onPaginationModelChange?: (model: GridPaginationModel) => void;
    /** Optional sort model; when omitted, sort is not controlled. */
    sortModel?: GridSortModel;
    onSortModelChange?: (model: GridSortModel) => void;
    hidePagination?: boolean;
    compact?: boolean;
    onRowClick?: (row: T) => void;
    getRowSx?: (row: T) => object;
    emptyStateMessage?: string;
    emptyStateActionLabel?: string;
    emptyStateActionOnClick?: () => void;
    /** Extra props passed to the underlying MUI X DataGrid */
    dataGridProps?: Partial<React.ComponentProps<typeof DataGrid>>;
    rowHeight?: number | string;
    /** When true, the table container has no minHeight (e.g. for use inside a popover so height adapts to rows). */
    disableContainerMinHeight?: boolean;
}

function columnToGridColDef<T extends GridValidRowModel>(column: Column<T>): GridColDef<T> {
    const field = String(column.id);
    const col: GridColDef<T> = {
        field: field as keyof T & string,
        headerName: column.label,
        minWidth: column.minWidth ?? 80,
        flex: 1,
        align: 'left',
        sortable: column.sortable ?? true,
    };
    if (column.format) {
        col.valueFormatter = (value) => (value != null ? column.format!(value) : '');
    }
    if (column.render) {
        col.renderCell = (params: GridRenderCellParams<T>) => column.render!(params.row as T);
    }
    return col;
}

function CustomNoRowsOverlay({
    message,
    actionLabel,
    onAction,
}: {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                px: 2,
            }}
        >
            <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel && onAction ? 1.5 : 0 }}>
                {message}
            </Typography>
            {actionLabel && onAction && (
                <Button variant="contained" size="small" onClick={onAction} sx={{ textTransform: 'none' }}>
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    state,
    paginationModel: controlledPaginationModel,
    onPaginationModelChange,
    sortModel: controlledSortModel = [],
    onSortModelChange,
    hidePagination = false,
    compact = false,
    onRowClick,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API compatibility
    getRowSx,
    emptyStateMessage,
    emptyStateActionLabel,
    emptyStateActionOnClick,
    dataGridProps = {},
    rowHeight,
    disableContainerMinHeight = false,
}: DataTableProps<T>) {
    const { data, total, rowsPerPage: stateRowsPerPage, loading } = state;

    const [internalPaginationModel, setInternalPaginationModel] = React.useState<GridPaginationModel>(() => ({
        page: 0,
        pageSize: stateRowsPerPage ?? 10,
    }));

    const isPaginationControlled = controlledPaginationModel != null && onPaginationModelChange != null;
    const paginationModel = isPaginationControlled ? controlledPaginationModel! : internalPaginationModel;
    const setPaginationModel = isPaginationControlled ? onPaginationModelChange! : setInternalPaginationModel;

    const rowCount = isPaginationControlled ? total : data.length;
    const paginationMode = isPaginationControlled ? 'server' : 'client';

    const gridColumns: GridColDef<T>[] = React.useMemo(
        () => columns.map((col) => columnToGridColDef(col)),
        [columns],
    );

    const sortModel = controlledSortModel ?? [];
    const handleSortModelChange = onSortModelChange ?? (() => {});

    const noRowsOverlay = React.useMemo(
        () =>
            function NoRowsOverlaySlot() {
                return (
                    <CustomNoRowsOverlay
                        message={emptyStateMessage ?? 'No data found'}
                        actionLabel={emptyStateActionLabel}
                        onAction={emptyStateActionOnClick}
                    />
                );
            },
        [emptyStateMessage, emptyStateActionLabel, emptyStateActionOnClick],
    );

    const getRowId = React.useCallback((row: T) => String(row.id), []);

    const mergedSx = React.useMemo(
        () => ({
            width: '100%',
            border: 'none',
            '& .MuiDataGrid-main': {
                width: '100%',
            },
            '& .MuiDataGrid-virtualScroller': {
                width: '100%',
            },
            '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e0e0e0',
            },
            '& .MuiDataGrid-columnHeaders': {
                borderBottom: '1px solid #e0e0e0',
            },
            '& .MuiDataGrid-row': {
                cursor: onRowClick ? 'pointer' : 'default',
            },
            '& .MuiDataGrid-row:hover': onRowClick ? { bgcolor: 'action.hover' } : {},
            ...(dataGridProps.sx as object),
        }),
        [onRowClick, dataGridProps.sx],
    );

    return (
        <Paper sx={{ width: '100%', mb: 2, p: 0.5, borderRadius: 2, boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ width: '100%', ...(disableContainerMinHeight ? {} : { minHeight: 400 }) }}>
                <StyledDataGrid
                    {...dataGridProps}
                    rows={data}
                    {...(rowHeight !== undefined && {
                        ...(typeof rowHeight === 'number'
                            ? { rowHeight }
                            : { getRowHeight: () => rowHeight as unknown as GridRowHeightReturnValue }),
                    })}
                    columns={gridColumns}
                    getRowId={getRowId}
                    rowCount={rowCount}
                    paginationMode={paginationMode}
                    pagination={(hidePagination ? false : true) as unknown as true}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sortModel={sortModel}
                    onSortModelChange={handleSortModelChange}
                    loading={loading}
                    density={compact ? 'compact' : 'standard'}
                    disableRowSelectionOnClick
                    onRowClick={
                        onRowClick
                            ? (params: GridRowParams<T>) => onRowClick(params.row as T)
                            : undefined
                    }
                    slots={{
                        noRowsOverlay: noRowsOverlay,
                        pagination: CustomGridPagination,
                        ...dataGridProps.slots,
                    }}
                    slotProps={{
                        ...dataGridProps.slotProps,
                    }}
                    sx={mergedSx}
                    pageSizeOptions={[10, 20, 50, 100]}
                />
            </Box>
        </Paper>
    );
}
