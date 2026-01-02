export interface Column<T> {
    id: keyof T;
    label: string;
    minWidth?: number;
    align?: 'right' | 'left' | 'center';
    format?: (value: any) => string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
}

export type Order = 'asc' | 'desc';

export interface DataFetchParams {
    page: number;
    rowsPerPage: number;
    order: Order;
    orderBy: string;
    search: string;
}

export interface TableState<T> {
    data: T[];
    total: number;
    page: number;
    rowsPerPage: number;
    order: Order;
    orderBy: string;
    loading: boolean;
    search: string;
}
