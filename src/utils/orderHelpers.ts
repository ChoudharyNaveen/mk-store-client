/**
 * Helper to concatenate product name and variant name without repeating words
 */
export const concatProductAndVariant = (productName: string, variantName?: string): string => {
  const p = (productName || '').trim();
  const v = (variantName || '').trim();
  if (!v) return p;
  if (!p) return v;
  // If variant already contains product name, use variant
  if (v.toLowerCase().includes(p.toLowerCase())) return v;
  // If product already contains variant, use product
  if (p.toLowerCase().includes(v.toLowerCase())) return p;
  // Concatenate without repeating words (case-insensitive)
  const pWords = p.split(/\s+/).filter(Boolean);
  const vWords = v.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of pWords) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(w);
    }
  }
  for (const w of vWords) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(w);
    }
  }
  return result.join(' ');
};
