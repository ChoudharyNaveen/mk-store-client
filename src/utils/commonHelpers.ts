// remove empty key value pairs from an object and array
export const removeEmptyKeys = (obj: Record<string, unknown> | unknown[] | unknown): Record<string, unknown> | unknown[] | unknown => {
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key, value]) => value !== undefined && value !== null && value !== '' && key !== ''),
    );
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeEmptyKeys(item));
  }
  return obj;
};