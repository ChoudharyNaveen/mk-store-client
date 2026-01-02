import { useState, useEffect, useRef, useCallback } from 'react';
import { GridPaginationModel } from '@mui/x-data-grid';

export interface ServerPaginationConfig<T = any> {
    // API fetch function that returns data
    fetchFunction: (params: FetchParams) => Promise<ServerPaginationResponse<T>>;
    // Initial page size
    initialPageSize?: number;
    // Enable/disable server pagination
    enabled?: boolean;
    // Auto-fetch on mount
    autoFetch?: boolean;
    // Additional filters to pass to the API
    filters?: Record<string, any>;
    // Initial sorting configuration
    initialSorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
    // Debounce delay for search (ms)
    searchDebounceMs?: number;
    // Threshold for switching to server pagination (default: 1000)
    // If totalCount > threshold, use server pagination
    // If totalCount <= threshold, fetch all data and use client pagination
    paginationThreshold?: number;
}

export interface FetchParams {
    page?: number; // Page number for API (0-based: 0, 1, 2, ...). Omitted on initial fetch.
    pageSize?: number; // Omitted on initial fetch
    searchKeyword?: string;
    filters?: Record<string, any>;
    sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
    signal?: AbortSignal;
}

type FetchOverrideParams = Partial<FetchParams> & {
    force?: boolean;
    initialFetch?: boolean;
};

export interface ServerPaginationResponse<T = any> {
    list: T[];
    totalCount: number;
    pageDetails?: {
        pageNumber?: number;
        pageSize?: number;
        paginationEnabled?: boolean;
    };
}

export interface UseServerPaginationReturn<T = any> {
    // Data
    rows: T[];
    totalCount: number;
    loading: boolean;

    // Pagination
    paginationModel: GridPaginationModel;
    setPaginationModel: (model: GridPaginationModel | ((prev: GridPaginationModel) => GridPaginationModel)) => void;
    pageSizeOption: number;
    setPageSizeOption: (size: number) => void;

    // Search
    searchKeyword: string;
    setSearchKeyword: (keyword: string) => void;

    // Filters
    filters: Record<string, any>;
    setFilters: (filters: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;

    // Actions
    refresh: () => void;
    fetchData: (overrideParams?: FetchOverrideParams) => Promise<void>;

    // State
    isServerPagination: boolean;
    setIsServerPagination: (enabled: boolean) => void;
    resetFlag: boolean;
    setResetFlag: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export const useServerPagination = <T = any,>(
    config: ServerPaginationConfig<T>
): UseServerPaginationReturn<T> => {
    const {
        fetchFunction,
        initialPageSize = 10,
        enabled = true,
        autoFetch = true,
        filters: initialFilters = {},
        initialSorting = [],
        searchDebounceMs = 500,
        paginationThreshold = 1000,
    } = config;

    // State
    const [rows, setRows] = useState<T[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isServerPagination, setIsServerPagination] = useState(enabled);
    const [allDataFetched, setAllDataFetched] = useState(false);
    const [resetFlag, setResetFlag] = useState(false);

    // Pagination
    const [pageSizeOption, setPageSizeOption] = useState(initialPageSize);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: initialPageSize,
    });

    // Search and Filters
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
    const [sorting] = useState<Array<{ key: string; direction: 'ASC' | 'DESC' }>>(initialSorting);

    // Refs
    const abortControllerRef = useRef<AbortController | null>(null);
    const ignorePaginationChange = useRef(false);
    const hasHandledFirstRender = useRef(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialSearchKeywordRef = useRef(searchKeyword);
    const initialFiltersRef = useRef(JSON.stringify(filters));
    const lastFetchedPageRef = useRef<{ page: number; pageSize: number } | null>(null);
    const lastFetchSignatureRef = useRef<string>('');
    const previousResetFlagRef = useRef(resetFlag);
    const allDataRef = useRef<T[]>([]); // Store original unfiltered data for client-side search
    const isFetchingRef = useRef(false); // Track if a fetch is in progress to prevent duplicate calls
    const filtersChangeInProgressRef = useRef(false); // Track if filters are changing to prevent search effect interference
    const allDataFetchedRef = useRef(allDataFetched); // Ref to track allDataFetched without causing effect re-runs

    // Local search function for client-side filtering
    const filterDataLocally = useCallback((data: T[], keyword: string): T[] => {
        if (!keyword || keyword.trim() === '') {
            return data;
        }

        const searchTerm = keyword.toLowerCase().trim();
        return data.filter((item) => {
            // Search through all string values in the object
            return Object.values(item as Record<string, any>).some((value) => {
                if (value === null || value === undefined) {
                    return false;
                }
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchTerm);
                }
                if (typeof value === 'number') {
                    return value.toString().includes(searchTerm);
                }
                return false;
            });
        });
    }, []);

    // Fetch data function
    const fetchData = useCallback(
        async (overrideParams?: FetchOverrideParams) => {
            const {
                force: forceFetch = false,
                initialFetch: forceInitialFetch = false,
                ...fetchOverrides
            } = overrideParams || {};

            // Prevent duplicate calls - if already fetching and not forcing, skip
            // Allow forceInitialFetch to proceed even if already fetching (needed for filters)
            if (isFetchingRef.current && !forceFetch && !forceInitialFetch) {
                return;
            }

            // If already fetching with initialFetch, don't start another one
            if (isFetchingRef.current && forceInitialFetch) {
                return;
            }

            // Cancel any pending requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            isFetchingRef.current = true;
            setLoading(true);

            try {
                const effectiveFilters = fetchOverrides.filters ?? filters;
                const effectiveSearchKeyword =
                    fetchOverrides.searchKeyword ?? searchKeyword ?? '';
                const fetchSignature = JSON.stringify({
                    filters: effectiveFilters,
                    searchKeyword: effectiveSearchKeyword,
                });
                const isSameFetchSignature = fetchSignature === lastFetchSignatureRef.current;

                // Determine if we should use server or client pagination

                const fetchPageSize = paginationModel.pageSize;
                const fetchPage = paginationModel.page;

                // If we need to determine pagination mode (on first load or after filter/search change)
                if ((forceInitialFetch || !allDataFetched) && hasHandledFirstRender.current) {
                    // Initial fetch: Send pageNumber and pageSize (default to page 0, initialPageSize)
                    const initialParams: FetchParams = {
                        page: fetchOverrides.page ?? 0, // Send page 0 on initial fetch
                        pageSize: fetchOverrides.pageSize ?? fetchPageSize, // Send pageSize on initial fetch
                        searchKeyword: fetchOverrides.searchKeyword ?? effectiveSearchKeyword,
                        filters: effectiveFilters,
                        sorting: fetchOverrides.sorting ?? sorting,
                        signal: controller.signal,
                    };

                    const initialResponse = await fetchFunction(initialParams);
                    const totalRecords = initialResponse.totalCount || 0;
                    const fetchedRecords = initialResponse.list || [];
                    const paginationEnabled = initialResponse?.pageDetails?.paginationEnabled ?? false;

                    // Store totalCount - this is the ONLY time we get it
                    setTotalCount(totalRecords);
                    lastFetchSignatureRef.current = fetchSignature;

                    // Determine pagination mode based on server's response
                    if (paginationEnabled) {
                        // Use server pagination - backend says pagination is enabled
                        setIsServerPagination(true);
                        allDataRef.current = []; // Clear local data when using server pagination
                        setRows(fetchedRecords);
                        setAllDataFetched(true);
                        lastFetchedPageRef.current = { page: initialParams.page ?? 0, pageSize: initialParams.pageSize ?? fetchPageSize };
                    } else {
                        // Use client pagination - backend returned all data
                        setIsServerPagination(false);
                        // Store original unfiltered data for local search
                        allDataRef.current = fetchedRecords;
                        // Apply local search if searchKeyword exists
                        const filteredRecords = effectiveSearchKeyword
                            ? filterDataLocally(fetchedRecords, effectiveSearchKeyword)
                            : fetchedRecords;
                        setRows(filteredRecords);
                        setTotalCount(filteredRecords.length);
                        setAllDataFetched(true);
                        lastFetchedPageRef.current = { page: initialParams.page ?? 0, pageSize: initialParams.pageSize ?? fetchPageSize };
                    }

                    setLoading(false);
                    isFetchingRef.current = false;
                    return;
                }

                // If using client pagination and all data is already fetched, no need to fetch again
                if (!isServerPagination && allDataFetched && isSameFetchSignature && !forceFetch) {
                    setLoading(false);
                    isFetchingRef.current = false;
                    return;
                }

                // Normal server pagination fetch (only runs when isServerPagination is true)
                const params: FetchParams = {
                    page: fetchOverrides.page ?? fetchPage, // API uses 0-based page numbers (0, 1, 2...)
                    pageSize: fetchOverrides.pageSize ?? fetchPageSize,
                    searchKeyword: fetchOverrides.searchKeyword ?? searchKeyword,
                    filters: effectiveFilters,
                    sorting: fetchOverrides.sorting ?? sorting,
                    signal: controller.signal,
                };

                const response = await fetchFunction(params);

                setRows(response.list || []);
                lastFetchSignatureRef.current = fetchSignature;

                // IMPORTANT: totalCount is ONLY returned in the initial fetch
                // Never update it from subsequent page requests

                // Only sync page number from server if server returned a completely different page
                // than what we requested (rare edge case)
                const serverPage = response?.pageDetails?.pageNumber;
                if (
                    serverPage !== undefined &&
                    serverPage !== fetchPage // Server returned different page than we requested
                ) {
                    // Server gave us a different page - update our state to match
                    ignorePaginationChange.current = true;
                    lastFetchedPageRef.current = { page: serverPage, pageSize: fetchPageSize };
                    setPaginationModel((prev) => ({ ...prev, page: serverPage }));
                }

                // Update server pagination state if provided by backend
                if (response?.pageDetails?.paginationEnabled !== undefined) {
                    const newIsServerPagination = response.pageDetails.paginationEnabled;
                    if (newIsServerPagination !== isServerPagination) {
                        setIsServerPagination(newIsServerPagination);
                    }
                }
            } catch (error: any) {
                if (error.name === 'AbortError' || error.name === 'CanceledError') {
                    isFetchingRef.current = false;
                    return;
                }
                console.error('Error fetching data:', error);
                setRows([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        },
        [paginationModel.page, paginationModel.pageSize, searchKeyword, filters, sorting, fetchFunction, isServerPagination, allDataFetched, enabled, initialPageSize, paginationThreshold]
    );

    // Initial fetch
    useEffect(() => {
        if (autoFetch && !hasHandledFirstRender.current) {
            hasHandledFirstRender.current = true;
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch on pagination change (only for server pagination)
    useEffect(() => {
        if (!hasHandledFirstRender.current) return;
        if (!isServerPagination) return; // Skip if using client pagination
        if (!allDataFetched) return; // Skip if still determining pagination mode

        // Check if this is a programmatic change we should ignore
        if (ignorePaginationChange.current) {
            ignorePaginationChange.current = false;
            return;
        }

        // Check if we've already fetched this exact page (prevent duplicate calls)
        if (
            lastFetchedPageRef.current &&
            lastFetchedPageRef.current.page === paginationModel.page &&
            lastFetchedPageRef.current.pageSize === paginationModel.pageSize
        ) {
            return;
        }

        // This prevents the race condition where fetchData's state updates trigger this effect again
        lastFetchedPageRef.current = { page: paginationModel.page, pageSize: paginationModel.pageSize };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel.page, paginationModel.pageSize]);

    // Update ref when allDataFetched changes
    useEffect(() => {
        allDataFetchedRef.current = allDataFetched;
    }, [allDataFetched]);

    // Fetch on search with debounce
    useEffect(() => {
        if (!hasHandledFirstRender.current) return;

        // Don't trigger if filters are currently changing (filters effect will handle the fetch)
        if (filtersChangeInProgressRef.current) {
            return;
        }

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout
        searchTimeoutRef.current = setTimeout(() => {
            // Don't proceed if filters are changing or if already fetching
            if (filtersChangeInProgressRef.current || isFetchingRef.current) {
                return;
            }

            // If using client pagination, filter locally without API call
            // Use ref to avoid dependency on allDataFetched state
            if (!isServerPagination && allDataFetchedRef.current) {
                const filteredData = filterDataLocally(allDataRef.current, searchKeyword);
                setRows(filteredData);
                setTotalCount(filteredData.length);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
                return;
            }

            // If using server pagination, call API
            // Reset pagination state when search changes
            setAllDataFetched(false);
            lastFetchedPageRef.current = null; // Reset to allow fetching
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
            fetchData();
        }, searchDebounceMs);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchKeyword, isServerPagination, filterDataLocally]);

    // Fetch on filters change
    useEffect(() => {
        if (!hasHandledFirstRender.current) return;

        // Don't trigger on initial render if filters haven't changed
        const currentFilters = JSON.stringify(filters);
        if (currentFilters === initialFiltersRef.current) {
            initialFiltersRef.current = currentFilters;
            return;
        }

        // Prevent duplicate calls if already fetching
        if (isFetchingRef.current) {
            return;
        }

        // Mark that filters are changing to prevent search effect interference
        filtersChangeInProgressRef.current = true;

        // Reset pagination state when filters change
        // Filters always require API call, so clear local data
        allDataRef.current = [];
        setAllDataFetched(false);
        lastFetchedPageRef.current = null; // Reset to allow fetching
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        // Explicitly use initialFetch to ensure it goes through the initial fetch path
        fetchData({ initialFetch: true }).finally(() => {
            filtersChangeInProgressRef.current = false;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // Refresh function
    const refresh = useCallback(() => {
        fetchData({ force: true, initialFetch: true });
    }, [fetchData]);

    // Handle reset flag to clear filters and refetch without filters
    useEffect(() => {
        if (!resetFlag || previousResetFlagRef.current === resetFlag) {
            previousResetFlagRef.current = resetFlag;
            return;
        }

        initialFiltersRef.current = '__reset__';
        initialSearchKeywordRef.current = '__reset__';
        allDataRef.current = []; // Clear local data on reset
        setAllDataFetched(false);
        lastFetchedPageRef.current = null;
        lastFetchSignatureRef.current = '';

        setSearchKeyword('');
        setFilters({});
        setPaginationModel((prev) => ({ ...prev, page: 0 }));

        setResetFlag(false);
        previousResetFlagRef.current = false;
    }, [resetFlag, setFilters]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return {
        // Data
        rows,
        totalCount,
        loading,

        // Pagination
        paginationModel,
        setPaginationModel,
        pageSizeOption,
        setPageSizeOption,

        // Search
        searchKeyword,
        setSearchKeyword,

        // Filters
        filters,
        setFilters,

        // Actions
        refresh,
        fetchData,

        // State
        isServerPagination,
        setIsServerPagination,
        resetFlag,
        setResetFlag,
    };
};

