/**
 * Item Unit Constants
 * Grouped by category for better UX in dropdowns
 */

import type { ItemUnit } from '../types/product';

export interface ItemUnitOption {
  value: ItemUnit;
  label: string;
  category: string;
}

export const ITEM_UNIT_OPTIONS: ItemUnitOption[] = [
  // Volume Units
  { value: 'LTR', label: 'LTR (Liter)', category: 'Volume' },
  { value: 'ML', label: 'ML (Milliliter)', category: 'Volume' },
  { value: 'GAL', label: 'GAL (Gallon)', category: 'Volume' },
  { value: 'FL_OZ', label: 'FL_OZ (Fluid Ounce)', category: 'Volume' },
  
  // Weight Units
  { value: 'KG', label: 'KG (Kilogram)', category: 'Weight' },
  { value: 'G', label: 'G (Gram)', category: 'Weight' },
  { value: 'MG', label: 'MG (Milligram)', category: 'Weight' },
  { value: 'OZ', label: 'OZ (Ounce)', category: 'Weight' },
  { value: 'LB', label: 'LB (Pound)', category: 'Weight' },
  { value: 'TON', label: 'TON (Ton)', category: 'Weight' },
  
  // Count/Quantity Units
  { value: 'PCS', label: 'PCS (Pieces)', category: 'Count' },
  { value: 'UNIT', label: 'UNIT', category: 'Count' },
  { value: 'DOZEN', label: 'DOZEN', category: 'Count' },
  { value: 'SET', label: 'SET', category: 'Count' },
  { value: 'PAIR', label: 'PAIR', category: 'Count' },
  { value: 'BUNDLE', label: 'BUNDLE', category: 'Count' },
  
  // Packaging Units
  { value: 'PKG', label: 'PKG (Package)', category: 'Packaging' },
  { value: 'BOX', label: 'BOX', category: 'Packaging' },
  { value: 'BOTTLE', label: 'BOTTLE', category: 'Packaging' },
  { value: 'CAN', label: 'CAN', category: 'Packaging' },
  { value: 'CARTON', label: 'CARTON', category: 'Packaging' },
  { value: 'TUBE', label: 'TUBE', category: 'Packaging' },
  { value: 'JAR', label: 'JAR', category: 'Packaging' },
  { value: 'BAG', label: 'BAG', category: 'Packaging' },
  { value: 'POUCH', label: 'POUCH', category: 'Packaging' },
  
  // Length Units
  { value: 'M', label: 'M (Meter)', category: 'Length' },
  { value: 'CM', label: 'CM (Centimeter)', category: 'Length' },
  { value: 'MM', label: 'MM (Millimeter)', category: 'Length' },
  { value: 'FT', label: 'FT (Foot)', category: 'Length' },
  { value: 'IN', label: 'IN (Inch)', category: 'Length' },
  
  // Area Units
  { value: 'SQFT', label: 'SQFT (Square Foot)', category: 'Area' },
  { value: 'SQM', label: 'SQM (Square Meter)', category: 'Area' },
];

/**
 * Get item unit options grouped by category
 */
export const getItemUnitOptionsGrouped = (): Array<{ category: string; options: Array<{ value: ItemUnit; label: string }> }> => {
  const grouped: Record<string, Array<{ value: ItemUnit; label: string }>> = {};
  
  ITEM_UNIT_OPTIONS.forEach(option => {
    if (!grouped[option.category]) {
      grouped[option.category] = [];
    }
    grouped[option.category].push({
      value: option.value,
      label: option.label,
    });
  });
  
  return Object.keys(grouped).map(category => ({
    category,
    options: grouped[category],
  }));
};

/**
 * Get simple options array for dropdowns
 */
export const getItemUnitOptions = (): Array<{ value: ItemUnit; label: string }> => {
  return ITEM_UNIT_OPTIONS.map(option => ({
    value: option.value,
    label: option.label,
  }));
};

