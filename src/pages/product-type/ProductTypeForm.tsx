import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createProductType, updateProductType, getProductTypeById } from '../../services/product-type.service';
import { fetchSubCategories } from '../../services/sub-category.service';
import { mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useAppSelector } from '../../store/hooks';
import { FormTextField, FormSelect, FormProvider } from '../../components/forms';
import type { ProductTypeStatus, ProductType } from '../../types/product-type';
import type { SubCategory } from '../../types/sub-category';

const schema = yup.object({
  subCategoryId: yup.number().when('$isEdit', {
    is: false,
    then: (s) => s.required('Sub category is required').min(1, 'Select a sub category'),
    otherwise: (s) => s.optional(),
  }),
  title: yup.string().required('Title is required').trim().min(1, 'Title is required'),
  status: yup.string().oneOf(['ACTIVE', 'INACTIVE']).required('Status is required'),
});

type FormData = yup.InferType<typeof schema>;

const statusOptions: { value: ProductTypeStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export default function ProductTypeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const { user } = useAppSelector((state) => state.auth);
  const vendorId = user?.vendorId;
  const userId = user?.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  const methods = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      subCategoryId: 0,
      title: '',
      status: 'ACTIVE',
    },
    context: { isEdit: isEditMode },
  });

  const { reset, control } = methods;

  // Load subcategories for create mode dropdown
  useEffect(() => {
    if (isEditMode) return;
    let cancelled = false;
    const load = async () => {
      setLoadingSubCategories(true);
      try {
        const filters = mergeWithDefaultFilters([], vendorId, undefined);
        const res = await fetchSubCategories({
          page: 0,
          pageSize: 500,
          filters: filters as Record<string, unknown>,
        });
        if (!cancelled) setSubCategories(res.list || []);
      } catch (e) {
        console.error('Error fetching subcategories:', e);
        if (!cancelled) showErrorToast('Failed to load sub categories');
      } finally {
        if (!cancelled) setLoadingSubCategories(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isEditMode, vendorId]);

  // Load product type for edit
  useEffect(() => {
    if (!isEditMode || !id) return;
    let cancelled = false;
    const load = async () => {
      setFetching(true);
      try {
        const pt = await getProductTypeById(Number(id));
        if (cancelled || !pt) {
          if (!pt) showErrorToast('Product type not found');
          navigate('/product-types');
          return;
        }
        reset({
          subCategoryId: pt.subCategoryId ?? pt.subCategory?.id ?? 0,
          title: pt.title ?? '',
          status: (pt.status as ProductTypeStatus) ?? 'ACTIVE',
        });
      } catch (e) {
        console.error('Error fetching product type:', e);
        if (!cancelled) {
          showErrorToast('Failed to load product type');
          navigate('/product-types');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isEditMode, id, reset, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!userId) {
      showErrorToast('You must be logged in.');
      return;
    }
    setLoading(true);
    try {
      if (isEditMode && id) {
        const pt = await getProductTypeById(Number(id));
        if (!pt) {
          showErrorToast('Product type not found.');
          return;
        }
        const concurrencyStamp = pt.concurrencyStamp ?? pt.concurrency_stamp ?? '';
        if (!concurrencyStamp) {
          showErrorToast('Data is outdated. Please refresh and try again.');
          return;
        }
        await updateProductType(Number(id), {
          title: data.title.trim(),
          status: data.status as ProductTypeStatus,
          updatedBy: userId,
          concurrencyStamp,
        });
        showSuccessToast('Product type updated successfully.');
        navigate('/product-types');
      } else {
        if (!data.subCategoryId || data.subCategoryId < 1) {
          showErrorToast('Please select a sub category.');
          return;
        }
        await createProductType({
          subCategoryId: data.subCategoryId,
          title: data.title.trim(),
          status: data.status as ProductTypeStatus,
        });
        showSuccessToast('Product type created successfully.');
        navigate('/product-types');
      }
    } catch (e) {
      console.error('Error saving product type:', e);
      showErrorToast('Failed to save product type.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <FormProvider {...methods}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/product-types')} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {isEditMode ? 'Edit Product Type' : 'New Product Type'}
          </Typography>
        </Box>

        <Paper sx={{ p: 3, maxWidth: 560 }}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {!isEditMode && (
                <Grid size={{ xs: 12 }}>
                  <FormSelect
                    name="subCategoryId"
                    control={control}
                    label="Sub Category"
                    required
                    variant="outlined"
                    size="small"
                    disabled={loadingSubCategories}
                    options={[
                      { value: 0, label: 'Select sub category' },
                      ...subCategories.map((sc) => ({ value: sc.id, label: sc.title })),
                    ]}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <FormTextField
                  name="title"
                  control={control}
                  label="Title"
                  required
                  variant="outlined"
                  size="small"
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormSelect
                  name="status"
                  control={control}
                  label="Status"
                  required
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  options={statusOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                  >
                    {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => navigate('/product-types')}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </FormProvider>
  );
}
