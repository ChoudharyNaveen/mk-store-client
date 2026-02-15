import { useState, useEffect, useRef, useCallback } from "react";
import { GridPaginationModel } from "@mui/x-data-grid";

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
  initialSorting?: Array<{ key: string; direction: "ASC" | "DESC" }>;
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
  sorting?: Array<{ key: string; direction: "ASC" | "DESC" }>;
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
  setPaginationModel: (
    model:
      | GridPaginationModel
      | ((prev: GridPaginationModel) => GridPaginationModel),
  ) => void;
  pageSizeOption: number;
  setPageSizeOption: (size: number) => void;

  // Search
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;

  // Filters
  filters: Record<string, any>;
  setFilters: (
    filters:
      | Record<string, any>
      | ((prev: Record<string, any>) => Record<string, any>),
  ) => void;

  // Actions
  refresh: (overrideParams?: FetchOverrideParams) => void;
  fetchData: (overrideParams?: FetchOverrideParams) => Promise<void>;

  // State
  isServerPagination: boolean;
  setIsServerPagination: (enabled: boolean) => void;
  resetFlag: boolean;
  setResetFlag: (value: boolean | ((prev: boolean) => boolean)) => void;

  // DataTable helpers (for easier integration)
  // These handle the conversion between 0-based (internal) and 1-based (MUI Pagination)
  tableState: {
    data: T[];
    total: number;
    page: number; // 1-based for MUI Pagination
    rowsPerPage: number;
    order: "asc" | "desc";
    orderBy: string;
    loading: boolean;
    search: string;
  };
  tableHandlers: {
    handleRequestSort: (property: string) => void;
    handleChangePage: (event: unknown, newPage: number) => void; // newPage is 1-based from MUI
    handleChangeRowsPerPage: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    refresh: (overrideParams?: FetchOverrideParams) => void;
  };
}

export const useServerPagination = <T = any>(
  config: ServerPaginationConfig<T>,
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
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [sorting] =
    useState<Array<{ key: string; direction: "ASC" | "DESC" }>>(initialSorting);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const ignorePaginationChange = useRef(false);
  const hasHandledFirstRender = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSearchKeywordRef = useRef(searchKeyword);
  const initialFiltersRef = useRef(JSON.stringify(filters));
  const lastFetchedPageRef = useRef<{ page: number; pageSize: number } | null>(
    null,
  );
  const lastFetchSignatureRef = useRef<string>("");
  const previousResetFlagRef = useRef(resetFlag);
  const allDataRef = useRef<T[]>([]); // Store original unfiltered data for client-side search
  const searchKeywordRef = useRef(searchKeyword); // Always latest; avoids stale closure when fetch runs with empty search
  const isFetchingRef = useRef(false); // Track if a fetch is in progress to prevent duplicate calls
  const filtersChangeInProgressRef = useRef(false); // Track if filters are changing to prevent search effect interference
  const allDataFetchedRef = useRef(allDataFetched); // Ref to track allDataFetched without causing effect re-runs
  const filterChangeCausedPaginationResetRef = useRef(false); // When filters effect resets page to 0, pagination effect should skip to avoid double fetch
  const searchChangeCausedPaginationResetRef = useRef(false); // When search effect resets page to 0 and fetches, pagination effect should skip to avoid double fetch
  const skipNextSearchIfKeywordMatchesRef = useRef<string | null>(null); // When filters effect runs, skip the next search debounce if it would use the same keyword (e.g. Clear triggers both)

  // Local search function for client-side filtering
  const filterDataLocally = useCallback((data: T[], keyword: string): T[] => {
    if (!keyword || keyword.trim() === "") {
      return data;
    }

    const searchTerm = keyword.toLowerCase().trim();
    return data.filter((item) => {
      // Search through all string values in the object
      return Object.values(item as Record<string, any>).some((value) => {
        if (value === null || value === undefined) {
          return false;
        }
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm);
        }
        if (typeof value === "number") {
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
      if (isFetchingRef.current && !forceFetch && !forceInitialFetch) {
        return;
      }
      // If already fetching with initialFetch, don't start another one (unless force: true, e.g. search term changed)
      if (isFetchingRef.current && forceInitialFetch && !forceFetch) {
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
        searchKeywordRef.current = searchKeyword; // Keep ref in sync so overrides see latest when not passed
        const effectiveFilters = fetchOverrides.filters ?? filters;
        // Prefer explicit override (including '') over state/ref so empty search is never replaced by stale value
        const effectiveSearchKeyword =
          fetchOverrides.searchKeyword !== undefined
            ? fetchOverrides.searchKeyword
            : (searchKeywordRef.current ?? "");
        const fetchSignature = JSON.stringify({
          filters: effectiveFilters,
          searchKeyword: effectiveSearchKeyword,
        });
        const isSameFetchSignature =
          fetchSignature === lastFetchSignatureRef.current;

        // Determine if we should use server or client pagination

        const fetchPageSize = paginationModel.pageSize;
        const fetchPage = paginationModel.page;

        // If we need to determine pagination mode (on first load or after filter/search change)
        if (
          (forceInitialFetch || !allDataFetched) &&
          hasHandledFirstRender.current
        ) {
          // Initial fetch: Send pageNumber and pageSize (default to page 0, initialPageSize)
          const initialParams: FetchParams = {
            page: fetchOverrides.page ?? 0, // Send page 0 on initial fetch
            pageSize: fetchOverrides.pageSize ?? fetchPageSize, // Send pageSize on initial fetch
            searchKeyword:
              fetchOverrides.searchKeyword !== undefined
                ? fetchOverrides.searchKeyword
                : effectiveSearchKeyword,
            filters: effectiveFilters,
            sorting: fetchOverrides.sorting ?? sorting,
            signal: controller.signal,
          };

          const initialResponse = await fetchFunction(initialParams);
          const totalRecords = initialResponse.totalCount || 0;
          const fetchedRecords = initialResponse.list || [];
          const paginationEnabled =
            initialResponse?.pageDetails?.paginationEnabled ?? false;

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
            lastFetchedPageRef.current = {
              page: initialParams.page ?? 0,
              pageSize: initialParams.pageSize ?? fetchPageSize,
            };
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
            lastFetchedPageRef.current = {
              page: initialParams.page ?? 0,
              pageSize: initialParams.pageSize ?? fetchPageSize,
            };
          }

          hasHandledFirstRender.current = true;
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }

        // If using client pagination and all data is already fetched, no need to fetch again
        if (
          !isServerPagination &&
          allDataFetched &&
          isSameFetchSignature &&
          !forceFetch
        ) {
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }

        // Normal server pagination fetch (only runs when isServerPagination is true)
        const params: FetchParams = {
          page: fetchOverrides.page ?? fetchPage, // API uses 0-based page numbers (0, 1, 2...)
          pageSize: fetchOverrides.pageSize ?? fetchPageSize,
          searchKeyword:
            fetchOverrides.searchKeyword !== undefined
              ? fetchOverrides.searchKeyword
              : (searchKeywordRef.current ?? ""),
          filters: effectiveFilters,
          sorting: fetchOverrides.sorting ?? sorting,
          signal: controller.signal,
        };

        const response = await fetchFunction(params);

        setRows(response.list || []);
        lastFetchSignatureRef.current = fetchSignature;
        const serverPage = response?.pageDetails?.pageNumber;
        if (serverPage !== undefined) {
          // Convert server's 1-based pageNumber to 0-based for comparison
          const serverPageZeroBased = serverPage - 1;
          if (serverPageZeroBased !== fetchPage) {
            // Server returned different page than we requested - update our state to match
            ignorePaginationChange.current = true;
            lastFetchedPageRef.current = {
              page: serverPageZeroBased,
              pageSize: fetchPageSize,
            };
            setPaginationModel((prev) => ({
              ...prev,
              page: serverPageZeroBased,
            }));
          }
        }

        // Update server pagination state if provided by backend
        if (response?.pageDetails?.paginationEnabled !== undefined) {
          const newIsServerPagination = response.pageDetails.paginationEnabled;
          if (newIsServerPagination !== isServerPagination) {
            setIsServerPagination(newIsServerPagination);
          }
        }
        hasHandledFirstRender.current = true;
      } catch (error: any) {
        if (error.name === "AbortError" || error.name === "CanceledError") {
          isFetchingRef.current = false;
          return;
        }
        console.error("Error fetching data:", error);
        setRows([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [
      paginationModel.page,
      paginationModel.pageSize,
      searchKeyword,
      filters,
      sorting,
      fetchFunction,
      isServerPagination,
      allDataFetched,
      enabled,
      initialPageSize,
      paginationThreshold,
    ],
  );

  // Initial fetch
  useEffect(() => {
    if (autoFetch && !hasHandledFirstRender.current) {
      hasHandledFirstRender.current = true;
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When filters change, set ref so the pagination effect (which runs before the filters effect) can skip and avoid duplicate fetch
  useEffect(() => {
    if (!hasHandledFirstRender.current) return;
    const currentFilters = JSON.stringify(filters);
    if (currentFilters === initialFiltersRef.current) return;
    filterChangeCausedPaginationResetRef.current = true;
  }, [filters]);

  // Fetch on pagination change (only for server pagination)
  useEffect(() => {
    if (!hasHandledFirstRender.current) return;
    if (!isServerPagination) return; // Skip if using client pagination
    if (!allDataFetched) return; // Skip if still determining pagination mode

    // Skip when filters effect just reset page to 0 to avoid double fetch
    if (filterChangeCausedPaginationResetRef.current) {
      filterChangeCausedPaginationResetRef.current = false;
      return;
    }
    // Skip when search effect just reset page to 0 and fetched (avoids duplicate API call on search)
    if (searchChangeCausedPaginationResetRef.current) {
      searchChangeCausedPaginationResetRef.current = false;
      return;
    }

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
    lastFetchedPageRef.current = {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize]);

  // Update ref when allDataFetched changes
  useEffect(() => {
    allDataFetchedRef.current = allDataFetched;
  }, [allDataFetched]);

  // Fetch on search with debounce — no skip conditions; every keyword change (including backspace) runs the API after debounce
  useEffect(() => {
    // Cancel any in-flight fetch so the new search term can run (e.g. user typed "maida" then backspaced to "mai")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Capture current keyword so the callback always uses the value from when the timer was set
    const currentSearchKeyword = searchKeyword;
    searchTimeoutRef.current = setTimeout(() => {
      // Skip if the filters effect just ran with this same keyword (e.g. Clear triggers filters + search; one fetch is enough)
      if (
        skipNextSearchIfKeywordMatchesRef.current === currentSearchKeyword ||
        (currentSearchKeyword?.length <= 0 && searchKeywordRef.current?.length <= 0)
      ) {
        skipNextSearchIfKeywordMatchesRef.current = null;
        return;
      }
      // Signal pagination effect to skip (we reset page and fetch here; one fetch is enough)
      searchChangeCausedPaginationResetRef.current = true;
      setAllDataFetched(false);
      lastFetchedPageRef.current = null;
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
      // So the search effect's debounced callback can skip if it would fetch with the same keyword (e.g. Clear sets search '' and filters; one fetch is enough)
      skipNextSearchIfKeywordMatchesRef.current =
        searchKeywordRef.current ?? "";
      fetchData({
        force: true,
        initialFetch: true,
        searchKeyword: currentSearchKeyword,
        page: 0,
      });
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
      return;
    }

    // Prevent duplicate calls if already fetching
    if (isFetchingRef.current) {
      return;
    }

    // Update baseline so next time we compare against these filters (enables Clear to work: after Apply, baseline is non-empty; on Clear, empty !== baseline so we fetch)
    initialFiltersRef.current = currentFilters;

    // Mark that filters are changing to prevent search effect interference
    filtersChangeInProgressRef.current = true;
    // Signal pagination effect to skip (we're resetting page to 0 here; one fetch is enough)
    filterChangeCausedPaginationResetRef.current = true;
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

  // Refresh function (optional overrides e.g. searchKeyword: '' when clearing filters)
  const refresh = useCallback(
    (overrideParams?: FetchOverrideParams) => {
      fetchData({ force: true, initialFetch: true, ...overrideParams });
    },
    [fetchData],
  );

  // Handle reset flag to clear filters and refetch without filters
  useEffect(() => {
    if (!resetFlag || previousResetFlagRef.current === resetFlag) {
      previousResetFlagRef.current = resetFlag;
      return;
    }

    initialFiltersRef.current = "__reset__";
    initialSearchKeywordRef.current = "__reset__";
    allDataRef.current = []; // Clear local data on reset
    setAllDataFetched(false);
    lastFetchedPageRef.current = null;
    lastFetchSignatureRef.current = "";

    setSearchKeyword("");
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

  // DataTable helpers - handle conversion between 0-based (internal) and 1-based (MUI)
  const tableState = {
    data: rows,
    total: totalCount,
    page: paginationModel.page + 1, // Convert 0-based to 1-based for MUI Pagination
    rowsPerPage: paginationModel.pageSize,
    order: "asc" as const,
    orderBy: "",
    loading,
    search: searchKeyword,
  };

  const tableHandlers = {
    handleRequestSort: () => {
      // Sorting can be handled via filters if API supports it
    },
    handleChangePage: (_event: unknown, newPage: number) => {
      // MUI Pagination passes 1-based page numbers, convert to 0-based for API
      setPaginationModel((prev) => ({ ...prev, page: newPage - 1 }));
    },
    handleChangeRowsPerPage: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const newPageSize = parseInt(event.target.value, 10);
      setPaginationModel((prev) => ({
        ...prev,
        pageSize: newPageSize,
        page: 0,
      }));
    },
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchKeyword(event.target.value);
    },
    refresh,
  };

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

    // DataTable helpers
    tableState,
    tableHandlers,
  };
};
