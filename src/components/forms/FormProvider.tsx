import { ReactNode, FormEvent } from 'react';
import { FieldValues, FormProvider as Form, UseFormReturn } from 'react-hook-form';

// ----------------------------------------------------------------------

interface FormProviderProps<T extends FieldValues = FieldValues> {
  children: ReactNode;
  methods: UseFormReturn<T>;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  noValidate?: boolean;
}

export default function FormProvider<T extends FieldValues = FieldValues>({
  children,
  onSubmit,
  noValidate = false,
  methods,
}: FormProviderProps<T>) {
  return (
    <Form {...methods}>
      <form autoComplete="off" noValidate={noValidate} onSubmit={onSubmit}>
        {children}
      </form>
    </Form>
  );
}

