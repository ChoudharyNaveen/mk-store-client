import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  fetchProductDetails,
  fetchProductStats,
  fetchInventoryMovements,
  fetchProducts,
} from "../../services/product.service";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import type { Product, ProductVariant } from "../../types/product";
import type { ProductStats, InventoryMovement } from "../../types/product";
import DataTable from "../../components/DataTable";
import DetailPageSkeleton from "../../components/DetailPageSkeleton";
import KPICard from "../../components/KPICard";
import { useRecentlyViewed } from "../../contexts/RecentlyViewedContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import type { Column, TableState } from "../../types/table";
import {
  formatExpiryDate,
  getExpiryDateColor,
} from "../../utils/productHelpers";
import { format } from "date-fns";
import { useAppSelector } from "../../store/hooks";
import { mergeWithDefaultFilters } from "../../utils/filterBuilder";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Helper to get default product image
const getDefaultImage = (product: Product): string | undefined => {
  if (product.images && product.images.length > 0) {
    const defaultImage = product.images.find((img) => img.is_default);
    return defaultImage?.image_url || product.images[0]?.image_url;
  }
  return product.image;
};

export default function ProductDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const selectedBranchId = useAppSelector(
    (state) => state.branch.selectedBranchId,
  );
  const vendorId = user?.vendorId;
  const { addProduct } = useRecentlyViewed();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [productIds, setProductIds] = React.useState<number[]>([]);
  const [productStats, setProductStats] = React.useState<ProductStats | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [tabValue, setTabValue] = React.useState(0);
  const [overviewTabValue, setOverviewTabValue] = React.useState(0);

  const { paginationModel, setPaginationModel, tableState, tableHandlers } =
    useServerPagination<InventoryMovement>({
      fetchFunction: async (params) => {
        if (!id) return { list: [], totalCount: 0 };
        return await fetchInventoryMovements(
          id,
          params.page || 0,
          params.pageSize || 10,
        );
      },
      initialPageSize: 10,
    });

  // Get productIds from location state (passed from ProductList) or fetch for prev/next fallback
  React.useEffect(() => {
    const state = location.state as { productIds?: number[] } | null;
    if (state?.productIds && Array.isArray(state.productIds)) {
      setProductIds(state.productIds);
    } else {
      setProductIds([]);
    }
  }, [location.state]);

  const fetchAdjacentProductIds = React.useCallback(async () => {
    if (!id) return;
    const currentId = Number(id);
    const baseFilters = mergeWithDefaultFilters([], vendorId, selectedBranchId);
    try {
      const [prevRes, nextRes] = await Promise.all([
        fetchProducts({
          page: 0,
          pageSize: 1,
          filters: [...baseFilters, { key: "id", lt: String(currentId) }],
          sorting: [{ key: "id", direction: "DESC" }],
        }),
        fetchProducts({
          page: 0,
          pageSize: 1,
          filters: [...baseFilters, { key: "id", gt: String(currentId) }],
          sorting: [{ key: "id", direction: "ASC" }],
        }),
      ]);
      const prevId = prevRes.list?.[0]?.id;
      const nextId = nextRes.list?.[0]?.id;
      const ids: number[] = [];
      if (prevId != null) ids.push(prevId);
      ids.push(currentId);
      if (nextId != null) ids.push(nextId);
      setProductIds(ids);
    } catch (err) {
      console.error("Error fetching adjacent products:", err);
    }
  }, [id, vendorId, selectedBranchId]);

  React.useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        navigate("/products");
        return;
      }

      // Clear old data immediately when id changes so we don't show stale product
      setProduct(null);
      setProductStats(null);
      setLoading(true);

      try {
        const [productData, statsData] = await Promise.all([
          fetchProductDetails(id),
          fetchProductStats(id).catch((error) => {
            console.error("Error fetching product stats:", error);
            return null;
          }),
        ]);
        setProduct(productData);
        setProductStats(statsData);
      } catch (error) {
        console.error("Error fetching product:", error);
        showErrorToast("Failed to load product details");
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  // Fetch adjacent product IDs when no productIds from location (e.g. direct URL, bookmark)
  React.useEffect(() => {
    if (product && productIds.length === 0) {
      fetchAdjacentProductIds();
    }
  }, [product, productIds.length, fetchAdjacentProductIds]);

  // Refresh inventory/audit tab data when product id changes (prevents stale data when navigating)
  const prevIdRef = React.useRef<string | undefined>(id);
  React.useEffect(() => {
    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      if (id) {
        tableHandlers.refresh();
      }
    }
  }, [id, tableHandlers]);

  // Reset tabs when switching products so we show Overview first
  React.useEffect(() => {
    setTabValue(0);
    setOverviewTabValue(0);
  }, [id]);

  React.useEffect(() => {
    if (product?.id != null && product?.title) {
      addProduct(product.id, product.title);
    }
  }, [product?.id, product?.title, addProduct]);

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!product) {
    return null;
  }

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "success" : "default";
  };

  const getAvailabilityColor = (status: string) => {
    return status === "INSTOCK" ? "success" : "error";
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOverviewTabChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setOverviewTabValue(newValue);
  };

  const currentIndex =
    productIds.length > 0 ? productIds.indexOf(Number(id)) : -1;
  const prevProductId = currentIndex > 0 ? productIds[currentIndex - 1] : null;
  const nextProductId =
    currentIndex >= 0 && currentIndex < productIds.length - 1
      ? productIds[currentIndex + 1]
      : null;

  const handleNavigateToProduct = (productId: number) => {
    navigate(`/products/detail/${productId}`, { state: { productIds } });
  };

  const imageUrl = getDefaultImage(product);

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#333" }}>
              {product.title || "Product"}
            </Typography>
            {id && (
              <Tooltip title="Copy product ID">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (id) {
                      navigator.clipboard.writeText(id);
                      showSuccessToast("Product ID copied");
                    }
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {(prevProductId != null || nextProductId != null) && (
              <Stack direction="row" spacing={0.5}>
                <Tooltip
                  title={
                    prevProductId != null
                      ? "Previous product"
                      : "No previous product"
                  }
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={() =>
                        prevProductId != null &&
                        handleNavigateToProduct(prevProductId)
                      }
                      disabled={prevProductId == null}
                      sx={{ border: "1px solid", borderColor: "divider" }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    nextProductId != null ? "Next product" : "No next product"
                  }
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={() =>
                        nextProductId != null &&
                        handleNavigateToProduct(nextProductId)
                      }
                      disabled={nextProductId == null}
                      sx={{ border: "1px solid", borderColor: "divider" }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            )}
            <Button
              variant="outlined"
              startIcon={<FileCopyIcon />}
              onClick={() =>
                navigate("/products/new", {
                  state: { cloneFromProductId: product.id },
                })
              }
              sx={{ textTransform: "none" }}
            >
              Clone
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/products/edit/${id}`)}
              sx={{ textTransform: "none" }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{
                bgcolor: "error.main",
                textTransform: "none",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              Delete
            </Button>
          </Stack>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3, mt: 3 }}>
          {[
            {
              label: "Total Orders",
              value: productStats?.total_orders ?? 0,
              icon: <ShoppingCartIcon />,
              iconBgColor: "#1976d2",
              bgColor: "#e3f2fd",
            },
            {
              label: "Units Sold",
              value: productStats?.units_sold ?? 0,
              icon: <TrendingUpIcon />,
              iconBgColor: "#2e7d32",
              bgColor: "#e8f5e9",
              valueColor: "#2e7d32",
            },
            {
              label: "Revenue Generated",
              value: productStats?.revenue_generated
                ? `₹${(productStats.revenue_generated / 1000000).toFixed(1)}M`
                : "₹0",
              icon: <InventoryIcon />,
              iconBgColor: "#0288d1",
              bgColor: "#e1f5fe",
              valueColor: "#0288d1",
            },
            {
              label: "Current Stock",
              value:
                productStats?.current_stock?.toLocaleString() ??
                product.quantity?.toLocaleString() ??
                0,
              icon: <WarehouseIcon />,
              iconBgColor: "#ed6c02",
              bgColor: "#fff3e0",
              valueColor: "#ed6c02",
            },
          ].map((kpi, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                iconBgColor={kpi.iconBgColor}
                bgColor={kpi.bgColor}
                valueColor={kpi.valueColor}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ pt: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab label="Overview" />
                <Tab label="Media" />
                <Tab label="Variants" />
                <Tab label="Audit" />
                <Tab label="Combo Discounts" />
              </Tabs>

              {/* Overview Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ mb: 3 }}>
                  {/* Image Section */}
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mb: 3 }}
                  >
                    {imageUrl ? (
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={product.title}
                        sx={{
                          width: "100%",
                          maxWidth: 400,
                          height: "auto",
                          borderRadius: 2,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 200,
                          height: 200,
                          bgcolor: "#e0e0e0",
                          fontSize: "3rem",
                        }}
                      >
                        {product.title.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mb: 3 }}
                  >
                    <Chip
                      label={product.status}
                      color={getStatusColor(product.status)}
                      size="small"
                    />
                  </Box>
                </Box>

                {/* Nested Tabs within Overview */}
                <Tabs
                  value={overviewTabValue}
                  onChange={handleOverviewTabChange}
                  sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
                >
                  <Tab label="Basic Information" />
                  <Tab label="Details" />
                  <Tab label="Metadata" />
                </Tabs>

                {/* Basic Information Tab */}
                <TabPanel value={overviewTabValue} index={0}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mb: 0.5 }}
                      >
                        Product ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        #{product.id}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mb: 0.5 }}
                      >
                        Status
                      </Typography>
                      <Chip
                        label={product.status}
                        color={getStatusColor(product.status)}
                        size="small"
                      />
                    </Grid>
                    {product.category && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 0.5 }}
                        >
                          Category
                        </Typography>
                        <Button
                          variant="text"
                          onClick={() =>
                            navigate(`/category/detail/${product.category?.id}`)
                          }
                          sx={{
                            textTransform: "none",
                            p: 0,
                            justifyContent: "flex-start",
                          }}
                        >
                          {product.category?.title || "N/A"}
                        </Button>
                      </Grid>
                    )}
                    {product.subCategory && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 0.5 }}
                        >
                          Sub Category
                        </Typography>
                        <Button
                          variant="text"
                          onClick={() =>
                            navigate(
                              `/sub-category/detail/${product.subCategory?.id}`,
                            )
                          }
                          sx={{
                            textTransform: "none",
                            p: 0,
                            justifyContent: "flex-start",
                          }}
                        >
                          {product.subCategory?.title || "N/A"}
                        </Button>
                      </Grid>
                    )}
                    {product.brand && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 0.5 }}
                        >
                          Brand
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {product.brand.logo && (
                            <Avatar
                              src={product.brand.logo}
                              alt={product.brand.name}
                              sx={{ width: 24, height: 24 }}
                            />
                          )}
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {product.brand.name}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {product.productType && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 0.5 }}
                        >
                          Product Type
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {product.productType.title}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </TabPanel>

                {/* Details Tab */}
                <TabPanel value={overviewTabValue} index={1}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 2, color: "#333" }}
                    >
                      Product Summary
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "text.secondary", mb: 2 }}
                    >
                      {product.variants && product.variants.length > 0
                        ? `This product has ${product.variants.length} variant${product.variants.length !== 1 ? "s" : ""}. View the Variants tab for pricing, stock, and expiry details.`
                        : "No variants configured. Use Edit to add variants."}
                    </Typography>
                    {product.variants && product.variants.length > 0 && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Total quantity across variants:{" "}
                        {product.variants
                          .reduce((acc, v) => acc + (v.quantity || 0), 0)
                          .toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </TabPanel>

                {/* Metadata Tab */}
                <TabPanel value={overviewTabValue} index={2}>
                  <Grid container spacing={2}>
                    {(product.created_at || product.createdAt) && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 0.5 }}
                        >
                          Created At
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {format(
                            new Date(
                              product.created_at || product.createdAt || "",
                            ),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </Typography>
                      </Grid>
                    )}
                    {(product.updated_at || product.updatedAt) && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 0.5 }}
                        >
                          Updated At
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {format(
                            new Date(
                              product.updated_at || product.updatedAt || "",
                            ),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </TabPanel>
              </TabPanel>

              {/* Media Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, color: "#333" }}
                >
                  Product Media
                </Typography>
                {product.images && product.images.length > 0 ? (
                  <Grid container spacing={2}>
                    {product.images
                      .sort(
                        (a, b) =>
                          (a.display_order || 0) - (b.display_order || 0),
                      )
                      .map((image) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={image.id}>
                          <Box sx={{ position: "relative" }}>
                            <Box
                              component="img"
                              src={image.image_url}
                              alt={`${product.title} - Image ${image.display_order || image.id}`}
                              sx={{
                                width: "100%",
                                height: 200,
                                objectFit: "cover",
                                borderRadius: 2,
                                border: "1px solid #e0e0e0",
                              }}
                            />
                            {image.is_default && (
                              <Chip
                                label="Default"
                                color="primary"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                }}
                              />
                            )}
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                Display Order: {image.display_order ?? "N/A"}
                              </Typography>
                              {image.variant_id && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    display: "block",
                                  }}
                                >
                                  Variant ID: {image.variant_id}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No images available
                  </Typography>
                )}
              </TabPanel>

              {/* Variants Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, color: "#333" }}
                >
                  Product Variants
                </Typography>
                {product.variants && product.variants.length > 0 ? (
                  (() => {
                    const variantColumns: Column<ProductVariant>[] = [
                      {
                        id: "variant_name",
                        label: "Variant Name",
                        render: (row: ProductVariant) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.variant_name || "Default"}
                          </Typography>
                        ),
                      },
                      {
                        id: "price",
                        label: "Base Price",
                        align: "right",
                        format: (value: number) =>
                          `₹${value?.toLocaleString() || "0.00"}`,
                      },
                      {
                        id: "selling_price",
                        label: "Selling Price",
                        align: "right",
                        render: (row: ProductVariant) => (
                          <Typography
                            sx={{ color: "success.main", fontWeight: 600 }}
                          >
                            ₹{row.selling_price?.toLocaleString() || "0.00"}
                          </Typography>
                        ),
                      },
                      {
                        id: "quantity",
                        label: "Quantity",
                        align: "right",
                        format: (value: number) =>
                          value?.toLocaleString() || "0",
                      },
                      {
                        id: "units",
                        label: "Units",
                        format: (value: string | null) => value || "N/A",
                      },
                      {
                        id: "items_per_unit",
                        label: "Items/Unit",
                        align: "right",
                        format: (value: number | null) =>
                          value?.toString() || "-",
                      },
                      {
                        id: "status",
                        label: "Status",
                        render: (row: ProductVariant) => (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={row.status || "N/A"}
                              color={getStatusColor(row.status || "ACTIVE")}
                              size="small"
                            />
                            <Chip
                              label={row.product_status || "N/A"}
                              color={getAvailabilityColor(
                                row.product_status || "INSTOCK",
                              )}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        ),
                      },
                      {
                        id: "expiry_date",
                        label: "Expiry Date",
                        render: (row: ProductVariant) =>
                          row.expiry_date ? (
                            <Typography
                              variant="body2"
                              sx={{
                                color: getExpiryDateColor(row.expiry_date),
                              }}
                            >
                              {formatExpiryDate(row.expiry_date)}
                            </Typography>
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary" }}
                            >
                              No expiry
                            </Typography>
                          ),
                      },
                    ];

                    const variantTableState: TableState<ProductVariant> = {
                      data: product.variants,
                      total: product.variants.length,
                      page: 0,
                      rowsPerPage: 10,
                      order: "asc",
                      orderBy: "variant_name",
                      loading: false,
                      search: "",
                    };

                    return (
                      <DataTable<ProductVariant>
                        columns={variantColumns}
                        state={variantTableState}
                      />
                    );
                  })()
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No variants available
                  </Typography>
                )}
              </TabPanel>

              {/* Audit Tab */}
              <TabPanel value={tabValue} index={3}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, color: "#333" }}
                >
                  Inventory Movements
                </Typography>
                {(() => {
                  const columns: Column<InventoryMovement>[] = [
                    {
                      id: "createdAt",
                      label: "Date",
                      minWidth: 150,
                      format: (value: string) =>
                        format(new Date(value), "MMM dd, yyyy HH:mm"),
                    },
                    {
                      id: "movementType",
                      label: "Type",
                      minWidth: 120,
                      render: (row: InventoryMovement) => (
                        <Chip
                          label={row.movementType}
                          size="small"
                          color={
                            row.movementType === "REMOVED"
                              ? "error"
                              : row.movementType === "ADDED"
                                ? "success"
                                : row.movementType === "REVERTED"
                                  ? "warning"
                                  : "default"
                          }
                        />
                      ),
                    },
                    {
                      id: "quantityChange",
                      label: "Change",
                      minWidth: 100,
                      align: "right",
                      render: (row: InventoryMovement) => (
                        <Typography
                          sx={{
                            color:
                              row.quantityChange >= 0
                                ? "success.main"
                                : "error.main",
                            fontWeight: 600,
                          }}
                        >
                          {row.quantityChange >= 0 ? "+" : ""}
                          {row.quantityChange}
                        </Typography>
                      ),
                    },
                    {
                      id: "quantityBefore",
                      label: "Before",
                      minWidth: 100,
                      align: "right",
                    },
                    {
                      id: "quantityAfter",
                      label: "After",
                      minWidth: 100,
                      align: "right",
                      render: (row: InventoryMovement) => (
                        <Typography sx={{ fontWeight: 600 }}>
                          {row.quantityAfter}
                        </Typography>
                      ),
                    },
                    {
                      id: "referenceType",
                      label: "Reference",
                      minWidth: 120,
                      render: (row: InventoryMovement) => (
                        <Box>
                          <Typography variant="body2">
                            {row.referenceType}{" "}
                            {row.referenceId ? `#${row.referenceId}` : ""}
                          </Typography>
                        </Box>
                      ),
                    },
                    {
                      id: "notes",
                      label: "Notes",
                      minWidth: 200,
                      format: (value: string | null) => value || "-",
                    },
                    {
                      id: "user",
                      label: "User",
                      minWidth: 150,
                      format: (value: InventoryMovement["user"]) => {
                        if (!value) return "N/A";
                        return value.name || value.email || `User ${value.id}`;
                      },
                    },
                  ];

                  return (
                    <DataTable<InventoryMovement>
                      columns={columns}
                      state={tableState}
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
                    />
                  );
                })()}
              </TabPanel>

              {/* Combo Discounts Tab */}
              <TabPanel value={tabValue} index={4}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
                >
                  <LocalOfferIcon
                    sx={{ color: "primary.main", fontSize: "1.5rem" }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#333" }}
                  >
                    Combo Discounts
                  </Typography>
                </Box>
                {(() => {
                  interface ComboDiscountRow {
                    id: string | number;
                    variantName: string;
                    variantId: number;
                    comboQuantity: number;
                    discountType: string;
                    discountValue: number;
                    startDate: string;
                    endDate: string;
                    status: string;
                  }

                  const comboDiscountRows: ComboDiscountRow[] = [];

                  product.variants?.forEach((variant) => {
                    const variantRecord = variant as unknown as Record<
                      string,
                      unknown
                    >;
                    const comboDiscounts =
                      variant.combo_discounts ||
                      variantRecord.comboDiscounts ||
                      [];

                    if (
                      Array.isArray(comboDiscounts) &&
                      comboDiscounts.length > 0
                    ) {
                      comboDiscounts.forEach(
                        (
                          discount: Record<string, unknown>,
                          discountIndex: number,
                        ) => {
                          const comboQuantity = (discount.combo_quantity ??
                            discount.comboQuantity) as number;
                          const discountType = (discount.discount_type ??
                            discount.discountType) as string;
                          const discountValue = (discount.discount_value ??
                            discount.discountValue) as number;
                          const startDate = (discount.start_date ??
                            discount.startDate) as string;
                          const endDate = (discount.end_date ??
                            discount.endDate) as string;
                          const status = (discount.status ||
                            "ACTIVE") as string;

                          comboDiscountRows.push({
                            id: `${variant.id}-${discountIndex}`,
                            variantName: variant.variant_name || "N/A",
                            variantId: variant.id,
                            comboQuantity,
                            discountType,
                            discountValue,
                            startDate,
                            endDate,
                            status,
                          });
                        },
                      );
                    }
                  });

                  if (comboDiscountRows.length === 0) {
                    return (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          textAlign: "center",
                          py: 4,
                        }}
                      >
                        No combo discounts available for this product
                      </Typography>
                    );
                  }

                  const columns: Column<ComboDiscountRow>[] = [
                    {
                      id: "variantName",
                      label: "Variant Name",
                      minWidth: 150,
                      render: (row) => (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.variantName}
                        </Typography>
                      ),
                    },
                    {
                      id: "comboQuantity",
                      label: "Combo Quantity",
                      minWidth: 120,
                      align: "right",
                      format: (value: number) => value.toString(),
                    },
                    {
                      id: "discountType",
                      label: "Discount Type",
                      minWidth: 120,
                      render: (row) => (
                        <Chip
                          label={row.discountType}
                          size="small"
                          color={
                            row.discountType === "PERCENT"
                              ? "primary"
                              : "secondary"
                          }
                          sx={{ fontWeight: 500 }}
                        />
                      ),
                    },
                    {
                      id: "discountValue",
                      label: "Discount Value",
                      minWidth: 130,
                      align: "right",
                      render: (row) => (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "success.main" }}
                        >
                          {row.discountType === "PERCENT"
                            ? `${row.discountValue}%`
                            : `Offer #${row.discountValue}`}
                        </Typography>
                      ),
                    },
                    {
                      id: "startDate",
                      label: "Start Date",
                      minWidth: 120,
                      format: (value: string) =>
                        format(new Date(value), "MMM dd, yyyy"),
                    },
                    {
                      id: "endDate",
                      label: "End Date",
                      minWidth: 120,
                      format: (value: string) =>
                        format(new Date(value), "MMM dd, yyyy"),
                    },
                    {
                      id: "status",
                      label: "Status",
                      minWidth: 100,
                      render: (row) => (
                        <Chip
                          label={row.status}
                          size="small"
                          color={
                            row.status === "ACTIVE" ? "success" : "default"
                          }
                        />
                      ),
                    },
                  ];

                  const comboDiscountTableState: TableState<ComboDiscountRow> =
                    {
                      data: comboDiscountRows,
                      total: comboDiscountRows.length,
                      page: 0,
                      rowsPerPage: 10,
                      order: "asc",
                      orderBy: "variantName",
                      loading: false,
                      search: "",
                    };

                  return (
                    <DataTable<ComboDiscountRow>
                      columns={columns}
                      state={comboDiscountTableState}
                    />
                  );
                })()}
              </TabPanel>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
