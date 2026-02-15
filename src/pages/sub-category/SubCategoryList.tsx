import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/EditOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DataTable from "../../components/DataTable";
import RowActionsMenu from "../../components/RowActionsMenu";
import type { RowActionItem } from "../../components/RowActionsMenu";
import ListPageLayout from "../../components/ListPageLayout";
import { useServerPagination } from "../../hooks/useServerPagination";
import { useListPageDateRange } from "../../hooks/useListPageDateRange";
import {
  fetchSubCategories,
  updateSubCategory,
} from "../../services/sub-category.service";
import { fetchCategories } from "../../services/category.service";
import type { SubCategory } from "../../types/sub-category";
import type { Category } from "../../types/category";
import type { ServerFilter } from "../../types/filter";
import {
  buildFiltersFromDateRangeAndAdvanced,
  mergeWithDefaultFilters,
} from "../../utils/filterBuilder";
import { useAppSelector } from "../../store/hooks";
import { SUBCATEGORY_STATUS_OPTIONS } from "../../constants/statusOptions";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

export default function SubCategoryList() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const selectedBranchId = useAppSelector(
    (state) => state.branch.selectedBranchId,
  );
  const vendorId = user?.vendorId;

  const { dateRange, handleDateRangeApply } = useListPageDateRange(30);

  const [updatingSubCategoryId, setUpdatingSubCategoryId] = React.useState<
    number | null
  >(null);
  const refreshTableRef = React.useRef<() => void>(() => {});

  const handleToggleStatus = React.useCallback(
    async (row: SubCategory) => {
      const newStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const concurrencyStamp =
        row.concurrencyStamp ??
        (row as SubCategory & { concurrency_stamp?: string })
          .concurrency_stamp ??
        "";
      if (!concurrencyStamp) {
        showErrorToast("Cannot toggle: missing concurrency stamp.");
        return;
      }
      const userId = user?.id;
      if (userId == null) {
        showErrorToast("User not found.");
        return;
      }
      setUpdatingSubCategoryId(row.id);
      try {
        await updateSubCategory(row.id, {
          title: row.title,
          description: row.description ?? "",
          updatedBy: userId,
          concurrencyStamp,
          status: newStatus,
        });
        showSuccessToast(`Sub category set to ${newStatus}.`);
        refreshTableRef.current();
      } catch {
        showErrorToast("Failed to update sub category status.");
      } finally {
        setUpdatingSubCategoryId(null);
      }
    },
    [user?.id],
  );

  const columns = [
    {
      id: "image" as keyof SubCategory,
      label: "Image",
      minWidth: 80,
      render: (row: SubCategory) => (
        <Avatar
          src={row.image}
          alt={row.title}
          variant="rounded"
          sx={{ width: 50, height: 50 }}
        />
      ),
    },
    {
      id: "title" as keyof SubCategory,
      label: "Sub Category",
      minWidth: 150,
      render: (row: SubCategory) => (
        <Typography
          component="button"
          onClick={() => navigate(`/sub-category/detail/${row.id}`)}
          sx={{
            background: "none",
            border: "none",
            color: "#204564",
            cursor: "pointer",
            textAlign: "left",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {row.title}
        </Typography>
      ),
    },
    {
      id: "category" as keyof SubCategory,
      label: "Category",
      minWidth: 150,
      render: (row: SubCategory) => row.category?.title || "N/A",
    },
    {
      id: "description" as keyof SubCategory,
      label: "Description",
      minWidth: 200,
    },
    { id: "status" as keyof SubCategory, label: "Status", minWidth: 100 },
    {
      id: "action" as keyof SubCategory,
      label: "Action",
      minWidth: 80,
      align: "center" as const,
      render: (row: SubCategory) => (
        <RowActionsMenu<SubCategory>
          row={row}
          ariaLabel="Sub-category actions"
          items={(r): RowActionItem<SubCategory>[] => [
            {
              type: "item",
              label: "View",
              icon: <VisibilityIcon fontSize="small" />,
              onClick: (s) => navigate(`/sub-category/detail/${s.id}`),
            },
            {
              type: "item",
              label: "Edit",
              icon: <EditIcon fontSize="small" />,
              onClick: (s) => navigate(`/sub-category/edit/${s.id}`),
            },
            { type: "divider" },
            {
              type: "item",
              label: r.status === "ACTIVE" ? "Deactivate" : "Activate",
              icon:
                r.status === "ACTIVE" ? (
                  <BlockIcon fontSize="small" />
                ) : (
                  <CheckCircleIcon fontSize="small" />
                ),
              onClick: (s) => handleToggleStatus(s),
              disabled: updatingSubCategoryId === r.id,
            },
          ]}
        />
      ),
    },
  ];

  const [filterAnchorEl, setFilterAnchorEl] =
    React.useState<null | HTMLElement>(null);

  type AdvancedFiltersState = {
    categoryIds: number[];
    status: string;
  };
  const emptyAdvancedFilters: AdvancedFiltersState = {
    categoryIds: [],
    status: "",
  };

  const [advancedFilters, setAdvancedFilters] =
    React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] =
    React.useState<AdvancedFiltersState>(emptyAdvancedFilters);

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const filterOptionsLoadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!filterAnchorEl || filterOptionsLoadedRef.current) return;
    let cancelled = false;
    const loadOptions = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetchCategories({
          page: 0,
          pageSize: 500,
          filters: mergeWithDefaultFilters([], vendorId, selectedBranchId),
        });
        if (!cancelled) {
          setCategories(res.list || []);
          filterOptionsLoadedRef.current = true;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading categories:", err);
          filterOptionsLoadedRef.current = false;
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [filterAnchorEl, vendorId, selectedBranchId]);

  const buildFilters = React.useCallback((): ServerFilter[] => {
    const applied = appliedAdvancedFilters;
    const advancedFiltersForBuild: Record<
      string,
      string | number[] | undefined
    > = {
      status: applied.status || undefined,
      categoryIds: applied.categoryIds?.length
        ? applied.categoryIds
        : undefined,
    };
    const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
      dateRange,
      dateField: "createdAt",
      advancedFilters: advancedFiltersForBuild,
      filterMappings: {
        categoryIds: { field: "categoryId", operator: "in" },
        status: { field: "status", operator: "eq" },
      },
    });
    return mergeWithDefaultFilters(
      additionalFilters,
      vendorId,
      selectedBranchId,
    );
  }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

  // Use server pagination hook - now includes tableState and tableHandlers
  const {
    paginationModel,
    setPaginationModel,
    setFilters,
    setSearchKeyword,
    tableState,
    tableHandlers,
  } = useServerPagination<SubCategory>({
    fetchFunction: fetchSubCategories,
    initialPageSize: 20,
    enabled: true,
    autoFetch: true,
    filters: buildFilters(),
    initialSorting: [{ key: "createdAt", direction: "DESC" }],
    searchDebounceMs: 500,
  });

  refreshTableRef.current = tableHandlers.refresh;

  // Update filters when applied filters or date range change (Apply only updates applied state; this effect triggers one fetch)
  React.useEffect(() => {
    setFilters(buildFilters());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [
    appliedAdvancedFilters,
    dateRange,
    setFilters,
    buildFilters,
    setPaginationModel,
  ]);

  React.useEffect(() => {
    if (filterAnchorEl) {
      setAdvancedFilters(appliedAdvancedFilters);
    }
  }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    setAppliedAdvancedFilters(advancedFilters);
    setFilterAnchorEl(null);
  };

  const handleClearFilters = () => {
    setSearchKeyword("");
    setAdvancedFilters(emptyAdvancedFilters);
    setAppliedAdvancedFilters(emptyAdvancedFilters);
    setFilterAnchorEl(null);
    // Effect runs (appliedAdvancedFilters changed) → setFilters + setPaginationModel → hook's filters effect fetches once; search effect skip ref prevents second fetch
  };

  return (
    <ListPageLayout
      title="Sub Categories"
      addButton={{ to: "/sub-category/new", label: "Add SubCategory" }}
      searchId="subcategory-search"
      searchPlaceholder="Search sub categories..."
      searchValue={tableState.search}
      onSearchChange={tableHandlers.handleSearch}
      onClearAndRefresh={handleClearFilters}
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeApply}
      onRefresh={() => tableHandlers.refresh()}
      filterAnchorEl={filterAnchorEl}
      onOpenFilterClick={(e) => setFilterAnchorEl(e.currentTarget)}
      onFilterClose={() => setFilterAnchorEl(null)}
      filterPopoverTitle="Filter Sub Categories"
      filterPopoverWidth={340}
      filterPopoverContent={
        <>
          <Autocomplete
            multiple
            size="small"
            options={categories}
            getOptionLabel={(option) =>
              typeof option === "object" && option?.title ? option.title : ""
            }
            value={categories.filter((c) =>
              advancedFilters.categoryIds.includes(c.id),
            )}
            onChange={(_, newValue) =>
              setAdvancedFilters({
                ...advancedFilters,
                categoryIds: newValue.map((c) => c.id),
              })
            }
            loading={loadingCategories}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Categories"
                placeholder={
                  advancedFilters.categoryIds.length ? "" : "Select categories"
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingCategories ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={advancedFilters.status}
              label="Status"
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  status: e.target.value,
                })
              }
            >
              <MenuItem value="">All</MenuItem>
              {SUBCATEGORY_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              onClick={handleClearFilters}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              Clear
            </Button>
            <Button
              onClick={handleApplyFilters}
              variant="contained"
              size="small"
            >
              Apply
            </Button>
          </Box>
        </>
      }
    >
      <DataTable
        key={`subcategory-table-${paginationModel.page}-${paginationModel.pageSize}`}
        columns={columns}
        state={tableState}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
      />
    </ListPageLayout>
  );
}
