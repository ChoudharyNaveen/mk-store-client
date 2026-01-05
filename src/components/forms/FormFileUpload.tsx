/**
 * Generic Form File Upload Component
 * Integrates react-hook-form with file input
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormFileUploadProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
  accept?: string;
  disabled?: boolean;
  preview?: string | null;
  onPreviewChange?: (preview: string | null) => void;
  minHeight?: number;
}

export default function FormFileUpload<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  accept = 'image/*',
  disabled = false,
  preview,
  onPreviewChange,
  minHeight = 250,
}: FormFileUploadProps<T>) {
  const handleFileChange = (file: File | null, onChange: (value: File | null) => void) => {
    onChange(file);
    
    if (file && onPreviewChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPreviewChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (!file && onPreviewChange) {
      onPreviewChange(null);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, ...field }, fieldState: { error } }) => (
        <Box>
          <Box
            sx={{
              flexGrow: 1,
              border: error ? '1px dashed #d32f2f' : '1px dashed #ccc',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              bgcolor: '#fdfdfd',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              '&:hover': disabled ? {} : { bgcolor: '#f5f5f5' },
              minHeight,
              position: 'relative',
              overflow: 'hidden',
            }}
            component="label"
          >
            <input
              {...field}
              value=""
              hidden
              accept={accept}
              type="file"
              disabled={disabled}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange(file, onChange);
              }}
            />
            {preview ? (
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              />
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  {label || 'Upload file'} {required && '*'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
                  Drop your file here
                </Typography>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid #3f51b5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3f51b5',
                  }}
                >
                  <CloudUploadIcon />
                </Box>
              </>
            )}
          </Box>
          {error && (
            <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, display: 'block' }}>
              {error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}

