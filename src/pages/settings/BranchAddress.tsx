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
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setBranches } from '../../store/branchSlice';
import { getBranches, updateBranch } from '../../services/branch.service';
import type { Branch } from '../../types/branch';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

/** Helper to get address fields from branch (handles API snake_case variants) */
function getBranchAddressFields(branch: Branch | Record<string, unknown>) {
  const b = branch as Record<string, unknown>;
  return {
    address_line1: (b.address_line1 ?? b.address_line_1 ?? '') as string,
    address_line2: (b.address_line2 ?? b.address_line_2 ?? '') as string,
    street: (b.street ?? '') as string,
    city: (b.city ?? '') as string,
    state: (b.state ?? '') as string,
    pincode: (b.pincode ?? '') as string,
    latitude: Number(b.latitude) || 0,
    longitude: Number(b.longitude) || 0,
    phone: (b.phone ?? '') as string,
    email: (b.email ?? '') as string,
    concurrencyStamp: (b.concurrency_stamp ?? b.concurrencyStamp ?? '') as string,
  };
}

function FieldRow({
  label,
  value,
  editMode,
  onChange,
  name,
  type = 'text',
  helperText,
}: {
  label: string;
  value: string | number;
  editMode: boolean;
  onChange?: (name: string, value: string) => void;
  name?: string;
  type?: 'number' | 'text' | 'email';
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
          inputProps={type === 'number' ? { step: 0.000001 } : undefined}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' },
          }}
        />
      ) : (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {strValue || '—'}
        </Typography>
      )}
    </Box>
  );
}

export default function BranchAddress() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { branches, selectedBranchId } = useAppSelector((state) => state.branch);

  const branch = selectedBranchId ? branches.find((b) => b.id === selectedBranchId) : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBranches({ pageSize: 100 });
      if (res?.success && res.doc) {
        dispatch(setBranches(res.doc));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load branches.');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (branch) {
      const fields = getBranchAddressFields(branch);
      setForm({
        address_line1: fields.address_line1 ?? '',
        address_line2: fields.address_line2 ?? '',
        street: fields.street ?? '',
        city: fields.city ?? '',
        state: fields.state ?? '',
        pincode: fields.pincode ?? '',
        latitude: String(fields.latitude || ''),
        longitude: String(fields.longitude || ''),
        phone: fields.phone ?? '',
        email: fields.email ?? '',
      });
    }
  }, [branch]);

  const handleFormChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    if (branch) {
      const fields = getBranchAddressFields(branch);
      setForm({
        address_line1: fields.address_line1 ?? '',
        address_line2: fields.address_line2 ?? '',
        street: fields.street ?? '',
        city: fields.city ?? '',
        state: fields.state ?? '',
        pincode: fields.pincode ?? '',
        latitude: String(fields.latitude || ''),
        longitude: String(fields.longitude || ''),
        phone: fields.phone ?? '',
        email: fields.email ?? '',
      });
    }
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!branch || !user?.id) {
      showErrorToast('Please select a branch and ensure you are logged in.');
      return;
    }
    const concurrencyStamp = String(branch.concurrency_stamp ?? '');
    if (!concurrencyStamp) {
      showErrorToast('Cannot update: missing concurrency stamp.');
      return;
    }
    setSaving(true);
    try {
      await updateBranch(branch.id, {
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        street: form.street || '',
        city: form.city || '',
        state: form.state || '',
        pincode: form.pincode || '',
        latitude: Number(form.latitude) || 0,
        longitude: Number(form.longitude) || 0,
        phone: form.phone || '',
        email: form.email || '',
        updatedBy: user.id,
        concurrencyStamp,
      });
      showSuccessToast('Branch address updated successfully.');
      setEditMode(false);
      fetchBranches();
    } catch {
      showErrorToast('Failed to update branch address.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper
        sx={{
          p: 2,
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 320,
        }}
      >
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
            <LocationOnIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Branch Address
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {branch
                ? `Address and service area for ${branch.name}`
                : 'Manage branch address and view service distance availability. Select a branch from the sidebar.'}
            </Typography>
          </Box>
        </Box>
        {branch && !editMode && (
          <Tooltip title="Edit address">
            <IconButton
              onClick={() => setEditMode(true)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {editMode && branch && (
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

      {!selectedBranchId && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Select a branch from the sidebar to view and edit its address.
        </Alert>
      )}

      {branch && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <InfoOutlinedIcon fontSize="small" />
            <Typography variant="body2">
              Branch address is used for delivery calculations and service area.
            </Typography>
          </Box>

          {/* Branch Address */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                Address
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Full address of the branch location.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="Address line 1"
                  value={form.address_line1 ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="address_line1"
                />
                <FieldRow
                  label="Address line 2"
                  value={form.address_line2 ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="address_line2"
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="Street"
                  value={form.street ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="street"
                />
                <FieldRow
                  label="City"
                  value={form.city ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="city"
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="State"
                  value={form.state ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="state"
                />
                <FieldRow
                  label="Pincode"
                  value={form.pincode ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="pincode"
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="Latitude"
                  value={form.latitude ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="latitude"
                  type="number"
                  helperText="Coordinates for distance calculations"
                />
                <FieldRow
                  label="Longitude"
                  value={form.longitude ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="longitude"
                  type="number"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                Contact
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start', minWidth: 0 }}>
                <FieldRow
                  label="Phone"
                  helperText="Branch contact number. This number is also used for WhatsApp communication with customers."
                  value={form.phone ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="phone"
                />
                <FieldRow
                  label="Email"
                  value={form.email ?? ''}
                  editMode={editMode}
                  onChange={handleFormChange}
                  name="email"
                  type="email"
                />
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Paper>
  );
}
