# Form Components Library

A collection of reusable form components that integrate `react-hook-form` with Material-UI components and `yup` validation.

## Available Components

### 1. FormTextField
Text input field with validation support.

```tsx
<FormTextField
  name="email"
  control={control}
  label="Email"
  required
  placeholder="Enter email"
  type="email"
/>
```

### 2. FormTextArea
Multi-line text input field.

```tsx
<FormTextArea
  name="description"
  control={control}
  label="Description"
  rows={6}
/>
```

### 3. FormNumberField
Numeric input field.

```tsx
<FormNumberField
  name="price"
  control={control}
  label="Price"
  required
  inputProps={{ min: 0, step: 0.01 }}
/>
```

### 4. FormSelect
Dropdown select field.

```tsx
<FormSelect
  name="status"
  control={control}
  label="Status"
  required
  options={[
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ]}
/>
```

### 5. FormAutocomplete
Autocomplete/combobox field with search.

```tsx
<FormAutocomplete
  name="category"
  control={control}
  label="Category"
  options={[
    { value: 1, label: 'Electronics' },
    { value: 2, label: 'Clothing' },
  ]}
/>
```

### 6. FormCheckbox
Single checkbox field.

```tsx
<FormCheckbox
  name="agreeToTerms"
  control={control}
  label="I agree to the terms and conditions"
/>
```

### 7. FormRadioGroup
Radio button group.

```tsx
<FormRadioGroup
  name="paymentMethod"
  control={control}
  label="Payment Method"
  required
  options={[
    { value: 'credit', label: 'Credit Card' },
    { value: 'debit', label: 'Debit Card' },
  ]}
  row // Display horizontally
/>
```

### 8. FormSwitch
Toggle switch field.

```tsx
<FormSwitch
  name="isActive"
  control={control}
  label="Active Status"
/>
```

### 9. FormDatePicker
Date picker field.

```tsx
<FormDatePicker
  name="birthDate"
  control={control}
  label="Birth Date"
  required
/>
```

### 10. FormFileUpload
File upload field with preview.

```tsx
<FormFileUpload
  name="image"
  control={control}
  label="Upload Image"
  required
  accept="image/*"
  preview={preview}
  onPreviewChange={setPreview}
/>
```

## Usage Example

```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  FormTextField,
  FormSelect,
  FormNumberField,
  FormCheckbox,
} from '../../components/forms';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  age: yup.number().positive('Age must be positive').required('Age is required'),
  status: yup.string().required('Status is required'),
  agree: yup.boolean().oneOf([true], 'You must agree'),
});

function MyForm() {
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      age: undefined,
      status: '',
      agree: false,
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormTextField name="name" control={control} label="Name" required />
      <FormTextField name="email" control={control} label="Email" type="email" required />
      <FormNumberField name="age" control={control} label="Age" required />
      <FormSelect
        name="status"
        control={control}
        label="Status"
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />
      <FormCheckbox name="agree" control={control} label="I agree" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Features

- ✅ Full TypeScript support
- ✅ Automatic validation error display
- ✅ Consistent styling
- ✅ Reusable across all forms
- ✅ Integrates with react-hook-form
- ✅ Yup validation support
- ✅ Accessible (ARIA labels, error messages)

