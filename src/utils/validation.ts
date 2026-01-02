/**
 * Validation Utilities
 * Common validation schemas and helpers
 */

import * as yup from 'yup';

/**
 * Common validation rules
 */
export const validationRules = {
  // String validations
  required: (message?: string) => yup.string().required(message || 'This field is required'),
  email: (message?: string) => yup.string().email(message || 'Invalid email address'),
  minLength: (length: number, message?: string) =>
    yup.string().min(length, message || `Must be at least ${length} characters`),
  maxLength: (length: number, message?: string) =>
    yup.string().max(length, message || `Must be at most ${length} characters`),
  
  // Number validations
  number: (message?: string) => yup.number().required(message || 'This field is required'),
  positiveNumber: (message?: string) =>
    yup.number().positive(message || 'Must be a positive number').required(message || 'This field is required'),
  minNumber: (min: number, message?: string) =>
    yup.number().min(min, message || `Must be at least ${min}`).required(message || 'This field is required'),
  maxNumber: (max: number, message?: string) =>
    yup.number().max(max, message || `Must be at most ${max}`).required(message || 'This field is required'),
  
  // File validations
  file: (message?: string) =>
    yup
      .mixed<File>()
      .required(message || 'File is required')
      .test('fileType', 'File must be an image', (value) => {
        if (!value) return false;
        return value instanceof File && value.type.startsWith('image/');
      })
      .test('fileSize', 'File size must be less than 5MB', (value) => {
        if (!value) return false;
        return value instanceof File && value.size <= 5 * 1024 * 1024;
      }),
  fileWithType: (allowedTypes: string[], message?: string) =>
    yup
      .mixed<File>()
      .required(message || 'File is required')
      .test('fileType', `File must be one of: ${allowedTypes.join(', ')}`, (value) => {
        if (!value) return false;
        return value instanceof File && allowedTypes.some(type => value.type.includes(type));
      }),
  
  // Date validations
  date: (message?: string) => yup.date().required(message || 'Date is required'),
  dateMin: (minDate: Date, message?: string) =>
    yup.date().min(minDate, message || `Date must be after ${minDate.toLocaleDateString()}`),
  dateMax: (maxDate: Date, message?: string) =>
    yup.date().max(maxDate, message || `Date must be before ${maxDate.toLocaleDateString()}`),
  
  // Boolean validations
  boolean: (message?: string) => yup.boolean().required(message || 'This field is required'),
  mustBeTrue: (message?: string) => yup.boolean().oneOf([true], message || 'This field must be checked'),
  
  // URL validations
  url: (message?: string) => yup.string().url(message || 'Must be a valid URL'),
  
  // Phone validations
  phone: (message?: string) =>
    yup.string().matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, message || 'Invalid phone number'),
};

/**
 * Category form validation schema
 */
export const categoryFormSchema = yup.object({
  title: yup.string().required('Title is required').min(2, 'Title must be at least 2 characters'),
  description: yup.string().optional().default(''),
  status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Status must be ACTIVE or INACTIVE').required('Status is required'),
  file: yup
    .mixed<File>()
    .required('Image file is required')
    .test('fileType', 'File must be an image', (value) => {
      if (!value) return false;
      return value instanceof File && value.type.startsWith('image/');
    })
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      if (!value) return false;
      return value instanceof File && value.size <= 5 * 1024 * 1024;
    }),
});

export interface CategoryFormData {
  title: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  file: File | null;
}

