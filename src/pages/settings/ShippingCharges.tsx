import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  MenuItem,
  InputAdornment,
  Chip,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EditIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAppSelector } from '../../store/hooks';
import { getBranchShippingConfig, saveBranchShippingConfig } from '../../services/shipping-config.service';
import type { BranchShippingConfig } from '../../types/shipping-config';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const emptyFormValues: Record<string, string> = {
  serviceDistanceKm: '0',
  distanceThresholdKm: '0',
  withinThresholdBaseCharge: '0',
  withinThresholdFreeAbove: '0',
  aboveThresholdSamedayBaseCharge: '0',
  aboveThresholdSamedayDiscountedCharge: '0',
  aboveThresholdSamedayFreeAbove: '0',
  aboveThresholdNextdayBaseCharge: '0',
  aboveThresholdNextdayFreeAbove: '0',
  status: 'ACTIVE',
};

function FieldRow({
  label,
  value,
  editMode,
  onChange,
  name,
  type = 'number',
  adornment,
  min,
  step = 1,
  helperText,
}: {
  label: string;
  value: string | number;
  editMode: boolean;
  onChange?: (name: string, value: string) => void;
  name?: string;
  type?: 'number' | 'text';
  adornment?: string;
  min?: number;
  step?: number;
  helperText?: string;
}) {
  const strValue = value === '' || value === null || value === undefined ? '' : String(value);
  return (
    <Box sx={{ mb: 2, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {helperText && (
          <Tooltip title={helperText} arrow placement="top">
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
          </Tooltip>
        )}
      </Box>
      {editMode ? (
        <TextField
          size="small"
          fullWidth
          type={type}
          value={strValue}
          onChange={(e) => onChange?.(name!, e.target.value)}
          name={name}
          inputProps={type === 'number' ? { min, step } : undefined}
          InputProps={
            adornment
              ? { startAdornment: <InputAdornment position="start">{adornment}</InputAdornment> }
              : undefined
          }
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' },
          }}
        />
      ) : (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {adornment && strValue !== '' ? `${adornment} ${strValue}` : strValue || '—'}
        </Typography>
      )}
    </Box>
  );
}

export default function ShippingCharges() {
  const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
  const [config, setConfig] = useState<BranchShippingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchConfig = useCallback(async () => {
    if (!selectedBranchId) {
      setLoading(false);
      setConfig(null);
      setError('Please select a branch first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getBranchShippingConfig(selectedBranchId);
      if (res?.success && res.doc) {
        const doc = res.doc;
        setConfig(doc);
        setForm({
          serviceDistanceKm: String(doc.serviceDistanceKm ?? ''),
          distanceThresholdKm: String(doc.distanceThresholdKm ?? ''),
          withinThresholdBaseCharge: String(doc.withinThresholdBaseCharge ?? ''),
          withinThresholdFreeAbove: String(doc.withinThresholdFreeAbove ?? ''),
          aboveThresholdSamedayBaseCharge: String(doc.aboveThresholdSamedayBaseCharge ?? ''),
          aboveThresholdSamedayDiscountedCharge: String(doc.aboveThresholdSamedayDiscountedCharge ?? ''),
          aboveThresholdSamedayFreeAbove: String(doc.aboveThresholdSamedayFreeAbove ?? ''),
          aboveThresholdNextdayBaseCharge: String(doc.aboveThresholdNextdayBaseCharge ?? ''),
          aboveThresholdNextdayFreeAbove: String(doc.aboveThresholdNextdayFreeAbove ?? ''),
          status: doc.status ?? 'ACTIVE',
        });
      } else {
        setConfig(null);
        setForm(emptyFormValues);
      }
    } catch (err: unknown) {
      setConfig(null);
      setError(err instanceof Error ? err.message : 'Failed to load shipping configuration.');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleFormChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    if (config) {
      setForm({
        serviceDistanceKm: String(config.serviceDistanceKm ?? ''),
        distanceThresholdKm: String(config.distanceThresholdKm ?? ''),
        withinThresholdBaseCharge: String(config.withinThresholdBaseCharge ?? ''),
        withinThresholdFreeAbove: String(config.withinThresholdFreeAbove ?? ''),
        aboveThresholdSamedayBaseCharge: String(config.aboveThresholdSamedayBaseCharge ?? ''),
        aboveThresholdSamedayDiscountedCharge: String(config.aboveThresholdSamedayDiscountedCharge ?? ''),
        aboveThresholdSamedayFreeAbove: String(config.aboveThresholdSamedayFreeAbove ?? ''),
        aboveThresholdNextdayBaseCharge: String(config.aboveThresholdNextdayBaseCharge ?? ''),
        aboveThresholdNextdayFreeAbove: String(config.aboveThresholdNextdayFreeAbove ?? ''),
        status: config.status ?? 'ACTIVE',
      });
    } else {
      setForm(emptyFormValues);
    }
    setEditMode(false);
  };

  const handleAddConfig = () => {
    setForm(emptyFormValues);
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedBranchId) {
      showErrorToast('Please select a branch first.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        branchId: selectedBranchId,
        serviceDistanceKm: Number(form.serviceDistanceKm) || 0,
        distanceThresholdKm: Number(form.distanceThresholdKm) || 0,
        withinThresholdBaseCharge: Number(form.withinThresholdBaseCharge) || 0,
        withinThresholdFreeAbove: Number(form.withinThresholdFreeAbove) || 0,
        aboveThresholdSamedayBaseCharge: Number(form.aboveThresholdSamedayBaseCharge) || 0,
        aboveThresholdSamedayDiscountedCharge: Number(form.aboveThresholdSamedayDiscountedCharge) || 0,
        aboveThresholdSamedayFreeAbove: Number(form.aboveThresholdSamedayFreeAbove) || 0,
        aboveThresholdNextdayBaseCharge: Number(form.aboveThresholdNextdayBaseCharge) || 0,
        aboveThresholdNextdayFreeAbove: Number(form.aboveThresholdNextdayFreeAbove) || 0,
      };
      await saveBranchShippingConfig(payload);
      showSuccessToast('Shipping configuration saved successfully.');
      setEditMode(false);
      fetchConfig();
    } catch {
      showErrorToast('Failed to save shipping configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LocalShippingIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Shipping Charges
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config?.branch?.name
                ? `Configuration for ${config.branch.name}`
                : 'Configure delivery distance, base charges, and free-shipping thresholds per branch.'}
            </Typography>
          </Box>
        </Box>
        {config && !editMode && (
          <Tooltip title="Edit configuration">
            <IconButton
              onClick={() => setEditMode(true)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {editMode && (config || selectedBranchId) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={handleCancelEdit}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        )}
      </Box>

      <Divider />

      {error && (
        <Alert severity="warning" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!config && !loading && !editMode && (
        <>
          {!selectedBranchId ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Select a branch from the sidebar to view and edit its shipping configuration.
            </Alert>
          ) : (
            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider', borderStyle: 'dashed' }}>
              <CardContent sx={{ py: 4, px: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <LocalShippingIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  No shipping configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 360, mx: 'auto' }}>
                  This branch does not have shipping charges set up yet. Add a configuration to define distance thresholds, base charges, and free-shipping rules.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddConfig}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}
                >
                  Add configuration
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {(config || (editMode && selectedBranchId)) && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <InfoOutlinedIcon fontSize="small" />
            <Typography variant="body2">
              These rules define shipping fees based on delivery distance and order value. Within-threshold rules apply for nearby orders; above-threshold rules apply for farther deliveries (same-day vs next-day).
            </Typography>
          </Box>

          {/* Service distance */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
            <CardContent>
              <FieldRow
                label="Service distance (km)"
                helperText="Online delivery will be available within this maximum distance."
                value={form.serviceDistanceKm ?? ''}
                editMode={editMode}
                onChange={handleFormChange}
                name="serviceDistanceKm"
                type="number"
                min={0}
                step={0.5}
              />
            </CardContent>
          </Card>

          {/* Within threshold */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Within threshold (nearby delivery)
                </Typography>
                <Tooltip title="Applied when delivery distance is within the threshold below. Base charge is applied unless the order value reaches the free-shipping amount." arrow placement="top">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="Distance threshold (km)"
                  helperText="Orders within this distance use &quot;Within threshold&quot; charges; beyond this, &quot;Above threshold&quot; same-day or next-day rules apply."
                  value={form.distanceThresholdKm ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="distanceThresholdKm"
                  type="number"
                  min={0}
                  step={0.5}
                />
                <FieldRow
                  label="Base charge (₹)"
                  helperText="Delivery charge applied for orders within the distance threshold."
                  value={form.withinThresholdBaseCharge ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="withinThresholdBaseCharge"
                  type="number"
                  adornment="₹"
                  min={0}
                  step={0.01}
                />
                <FieldRow
                  label="Free shipping above order value (₹)"
                  value={form.withinThresholdFreeAbove ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="withinThresholdFreeAbove"
                  type="number"
                  adornment="₹"
                  min={0}
                  step={0.01}
                  helperText="Orders at or above this amount get free shipping within threshold."
                />
              </Box>
            </CardContent>
          </Card>

          {/* Above threshold – same day */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Above threshold – same-day delivery
                </Typography>
                <Tooltip title="When delivery is beyond the distance threshold and fulfilled same day. Base or discounted charge applies; free above the given order value." arrow placement="top">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="Same-day base charge (₹)"
                  helperText="Base charge for same-day delivery beyond the distance threshold."
                  value={form.aboveThresholdSamedayBaseCharge ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="aboveThresholdSamedayBaseCharge"
                  type="number"
                  adornment="₹"
                  min={0}
                  step={0.01}
                />
                <FieldRow
                  label="Same-day discounted charge (₹)"
                  helperText="Discounted charge for same-day delivery beyond the distance threshold."
                  value={form.aboveThresholdSamedayDiscountedCharge ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="aboveThresholdSamedayDiscountedCharge"
                  type="number"
                  adornment="₹"
                  min={0}
                  step={0.01}
                />
                <FieldRow
                  label="Same-day free above (₹)"
                  helperText="Orders at or above this amount get free same-day delivery beyond the distance threshold."
                  value={form.aboveThresholdSamedayFreeAbove ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="aboveThresholdSamedayFreeAbove"
                  type="number"
                  adornment="₹"
                  min={0}
                  step={0.01}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Above threshold – next day */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Above threshold – next-day delivery
                </Typography>
                <Tooltip title="When delivery is beyond the distance threshold and fulfilled next day. Base charge applies; free above the given order value." arrow placement="top">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="Next-day base charge (₹)"
                  helperText="Base charge for next-day delivery beyond the distance threshold."
                  value={form.aboveThresholdNextdayBaseCharge ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="aboveThresholdNextdayBaseCharge"
                  type="number"
                  adornment="₹"
                  min={0}
                  step={0.01}
                />
                <FieldRow
                  label="Next-day free above (₹)"
                  helperText="Orders at or above this amount get free next-day delivery beyond the distance threshold."
                  value={form.aboveThresholdNextdayFreeAbove ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="aboveThresholdNextdayFreeAbove"
                  type="number"
                  adornment="₹"
                  min={0}
                  step={0.01}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Status */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Status
                </Typography>
                <Tooltip title="Inactive configuration will not be used for calculating shipping charges." arrow placement="top">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
              {editMode ? (
                <TextField
                  select
                  size="small"
                  value={form.status ?? 'ACTIVE'}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <Chip
                  label={form.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  size="small"
                  color={form.status === 'ACTIVE' ? 'success' : 'default'}
                  sx={{ fontWeight: 500 }}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Paper>
  );
}
