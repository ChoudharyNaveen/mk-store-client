import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { fetchProductDetails, updateProduct } from '../../services/product.service';
import type { Product, ProductVariant, ComboDiscount } from '../../types/product';
import type { ItemUnit } from '../../types/product';
import type { UpdateProductRequest } from '../../types/product';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';

export interface StockUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Product from list (used to open dialog); we refetch by id for latest concurrency stamps */
  product: Product | null;
}

/** Local editable row: quantity and Stock Unit (units) - Items Per Unit is read-only from variant */
interface EditableVariantRow extends ProductVariant {
  _quantity: number;
  _units: string | null;
}

function formatExpiryDate(expiryDate: string | Date | undefined | null): string {
  if (!expiryDate) return 'N/A';
  try {
    const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    return format(date, 'MMM dd, yyyy');
  } catch {
    return 'Invalid';
  }
}

/** Calculate Items Per Unit from Quantity and Stock Unit (same as NewProductForm). */
function getCalculatedItemsPerUnit(row: EditableVariantRow): number | null {
  const qty = row._quantity;
  const unitsStr = row._units?.trim();
  if (unitsStr == null || unitsStr === '') return null;
  const unitsNum = parseFloat(unitsStr);
  if (Number.isNaN(unitsNum) || unitsNum <= 0 || qty <= 0) return null;
  return Math.floor(qty / unitsNum);
}

export default function StockUpdateDialog({
  open,
  onClose,
  onSuccess,
  product,
}: StockUpdateDialogProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [productData, setProductData] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [rows, setRows] = React.useState<EditableVariantRow[]>([]);

  // When dialog opens with a product, fetch latest details for concurrency stamps
  React.useEffect(() => {
    if (!open || !product?.id) {
      setProductData(null);
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProductDetails(product.id)
      .then((data) => {
        if (!cancelled) {
          setProductData(data);
          const initial: EditableVariantRow[] = (data.variants || []).map((v) => ({
            ...v,
            _quantity: v.quantity ?? 0,
            _units: v.units ?? null,
          }));
          setRows(initial);
        }
      })
      .catch(() => {
        if (!cancelled) showErrorToast('Failed to load product details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, product?.id]);

  const handleQuantityChange = (variantId: number, value: string) => {
    const num = parseInt(value, 10);
    if (Number.isNaN(num) || num < 0) return;
    setRows((prev) =>
      prev.map((r) => (r.id === variantId ? { ...r, _quantity: num } : r))
    );
  };

  const handleStockUnitChange = (variantId: number, value: string) => {
    const trimmed = value.trim() || null;
    setRows((prev) =>
      prev.map((r) => (r.id === variantId ? { ...r, _units: trimmed } : r))
    );
  };

  const handleSubmit = async () => {
    if (!productData || !productData.id || !user?.id) {
      showErrorToast('Missing product or user.');
      return;
    }
    const concurrencyStamp =
      productData.concurrency_stamp ?? productData.concurrencyStamp ?? '';
    if (!concurrencyStamp) {
      showErrorToast('Product concurrency stamp missing. Please refresh and try again.');
      return;
    }
    if (rows.length === 0) {
      showErrorToast('At least one variant is required.');
      return;
    }

    const variantsPayload: UpdateProductRequest['variants'] = rows.map((r) => {
      let expiryDateValue: string | undefined;
      if (r.expiry_date) {
        const d = typeof r.expiry_date === 'string' ? new Date(r.expiry_date) : r.expiry_date;
        expiryDateValue = d.toISOString().split('T')[0];
      }
      const rawCombos = r.combo_discounts;
      const comboDiscounts: ComboDiscount[] | undefined =
        Array.isArray(rawCombos) && rawCombos.length > 0
          ? rawCombos.map((d: unknown) => {
              const x = d as Record<string, unknown>;
              const start = (x.startDate ?? x.start_date) as string | undefined;
              const end = (x.endDate ?? x.end_date) as string | undefined;
              return {
                comboQuantity: (x.comboQuantity ?? x.combo_quantity) as number,
                discountType: (x.discountType ?? x.discount_type) as ComboDiscount['discountType'],
                discountValue: (x.discountValue ?? x.discount_value) as number,
                startDate: typeof start === 'string' ? start : '',
                endDate: typeof end === 'string' ? end : '',
                status: (x.status as ComboDiscount['status']) ?? 'ACTIVE',
              };
            })
          : undefined;
      return {
        id: r.id,
        concurrencyStamp: r.concurrency_stamp ?? r.concurrencyStamp,
        variantName: r.variant_name,
        price: r.price,
        sellingPrice: r.selling_price,
        quantity: r._quantity,
        itemsPerUnit: getCalculatedItemsPerUnit(r) ?? r.items_per_unit ?? undefined,
        units: r._units ?? r.units ?? undefined,
        itemQuantity: r.item_quantity ?? undefined,
        itemUnit: (r.item_unit as ItemUnit) ?? undefined,
        expiryDate: expiryDateValue,
        status: r.status,
        description: r.description ?? undefined,
        nutritional: r.nutritional ?? undefined,
        comboDiscounts,
        thresholdStock: (r as ProductVariant & { threshold_stock?: number; thresholdStock?: number }).threshold_stock
          ?? (r as ProductVariant & { threshold_stock?: number; thresholdStock?: number }).thresholdStock
          ?? undefined,
      };
    });

    setSubmitting(true);
    try {
      await updateProduct(productData.id, {
        updatedBy: user.id,
        concurrencyStamp,
        variants: variantsPayload,
      });
      showSuccessToast('Stock updated successfully.');
      onSuccess?.();
      onClose();
    } catch {
      showErrorToast('Failed to update stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>Update Stock</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : productData && rows.length > 0 ? (
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              {productData.title}
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 440 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Variant</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>MRP</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Selling Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Stock Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Items Per Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.variant_name}</TableCell>
                      <TableCell align="right">₹{row.price}</TableCell>
                      <TableCell align="right">₹{row.selling_price}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={row._quantity}
                          onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                          inputProps={{ min: 0, step: 1 }}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={row._units ?? ''}
                          onChange={(e) => handleStockUnitChange(row.id, e.target.value)}
                          placeholder="e.g., 25"
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={getCalculatedItemsPerUnit(row) ?? row.items_per_unit ?? ''}
                          disabled
                          placeholder="Auto-calculated"
                          sx={{ width: 100 }}
                          inputProps={{ readOnly: true }}
                        />
                      </TableCell>
                      <TableCell>{formatExpiryDate(row.expiry_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.product_status}
                          size="small"
                          color={row.product_status === 'INSTOCK' ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : productData && rows.length === 0 ? (
          <Typography color="text.secondary">No variants to edit.</Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || loading || rows.length === 0}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
