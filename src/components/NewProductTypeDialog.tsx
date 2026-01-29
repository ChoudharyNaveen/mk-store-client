/**
 * Reusable dialog to create a new product type
 * Used in SubCategoryDetail Product Types tab
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormProvider from './forms/FormProvider';
import FormTextField from './forms/FormTextField';
import FormSelect from './forms/FormSelect';
import { createProductType } from '../services/product-type.service';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import type { ProductTypeStatus, ProductType } from '../types/product-type';

const statusOptions: { value: ProductTypeStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const schema = yup.object({
  title: yup.string().required('Title is required').trim(),
  status: yup.string().oneOf(['ACTIVE', 'INACTIVE']).required('Status is required'),
});

type FormData = yup.InferType<typeof schema>;

export interface NewProductTypeDialogProps {
  open: boolean;
  onClose: () => void;
  subCategoryId: number;
  onSuccess?: (created?: ProductType) => void;
}

export default function NewProductTypeDialog({
  open,
  onClose,
  subCategoryId,
  onSuccess,
}: NewProductTypeDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const methods = useForm<FormData>({
    defaultValues: {
      title: '',
      status: 'ACTIVE',
    },
    resolver: yupResolver(schema) as any,
  });

  const resetForm = React.useCallback(() => {
    methods.reset({ title: '', status: 'ACTIVE' });
  }, [methods]);

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      const response = await createProductType({
        subCategoryId,
        title: data.title.trim(),
        status: data.status as ProductTypeStatus,
      });
      showSuccessToast('Product type created successfully');
      onSuccess?.(response?.doc);
      handleClose();
    } catch (err) {
      console.error('Create product type error:', err);
      showErrorToast('Failed to create product type');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Add Product Type
        </Box>
      </DialogTitle>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormTextField<FormData>
              name="title"
              control={methods.control}
              label="Title"
              required
              autoFocus
              size="small"
              placeholder="e.g. Groundnut Oil"
            />
            <FormSelect<FormData>
              name="status"
              control={methods.control}
              label="Status"
              required
              options={statusOptions}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: 'none' }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
