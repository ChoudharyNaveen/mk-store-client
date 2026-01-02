import { useState, useEffect, useCallback, useRef } from 'react';
import { TableState, DataFetchParams, Order } from '../types/table';

interface UseTableProps<T> {
    fetchData: (params: DataFetchParams) => Promise<{ data: T[]; total: number }>;
    defaultOrderBy?: string;
    defaultOrder?: Order;
    initialRowsPerPage?: number;
}

export function useTable<T>({
    fetchData,
    defaultOrderBy = '',
    defaultOrder = 'asc',
    initialRowsPerPage = 10,
}: UseTableProps<T>) {
    const [state, setState] = useState<TableState<T>>({
        data: [],
        total: 0,
        page: 1, // 1-based index for UI consistency
        rowsPerPage: initialRowsPerPage,
        order: defaultOrder,
        orderBy: defaultOrderBy,
        loading: false,
        search: '',
    });

    // Use ref to store fetchData to avoid it being a dependency
    const fetchDataRef = useRef(fetchData);

    // Update ref when fetchData changes
    useEffect(() => {
        fetchDataRef.current = fetchData;
    }, [fetchData]);

    const loadData = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true }));
        try {
            const { data, total } = await fetchDataRef.current({
                page: state.page,
                rowsPerPage: state.rowsPerPage,
                order: state.order,
                orderBy: state.orderBy,
                search: state.search,
            });
            setState((prev) => ({ ...prev, data, total, loading: false }));
        } catch (error) {
            console.error('Failed to load data', error);
            setState((prev) => ({ ...prev, loading: false }));
        }
    }, [state.page, state.rowsPerPage, state.order, state.orderBy, state.search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRequestSort = (property: string) => {
        const isAsc = state.orderBy === property && state.order === 'asc';
        setState((prev) => ({
            ...prev,
            order: isAsc ? 'desc' : 'asc',
            orderBy: property,
            page: 1, // Reset to first page on sort
        }));
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setState((prev) => ({ ...prev, page: newPage }));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setState((prev) => ({
            ...prev,
            rowsPerPage: parseInt(event.target.value, 10),
            page: 1,
        }));
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState((prev) => ({
            ...prev,
            search: event.target.value,
            page: 1,
        }));
    };

    const refresh = () => {
        loadData();
    };

    return {
        state,
        handlers: {
            handleRequestSort,
            handleChangePage,
            handleChangeRowsPerPage,
            handleSearch,
            refresh
        },
    };
}
