/**
 * Product related types
 */

export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type ProductStatusType = 'INSTOCK' | 'OUTOFSTOCK';

/**
 * Item Unit Enum - 32 valid unit types
 */
export type ItemUnit = 
  // Volume Units
  | 'LTR' | 'ML' | 'GAL' | 'FL_OZ'
  // Weight Units
  | 'KG' | 'G' | 'MG' | 'OZ' | 'LB' | 'TON'
  // Count/Quantity Units
  | 'PCS' | 'UNIT' | 'DOZEN' | 'SET' | 'PAIR' | 'BUNDLE'
  // Packaging Units
  | 'PKG' | 'BOX' | 'BOTTLE' | 'CAN' | 'CARTON' | 'TUBE' | 'JAR' | 'BAG' | 'POUCH'
  // Length Units
  | 'M' | 'CM' | 'MM' | 'FT' | 'IN'
  // Area Units
  | 'SQFT' | 'SQM';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  selling_price: number;
  quantity: number;
  image: string;
  product_status: ProductStatusType;
  status: ProductStatus;
  units: string;
  nutritional: string | null;
  // New/Updated fields
  itemQuantity?: number; // Decimal/Number - measurement quantity per individual item (e.g., 500 for 500gm)
  itemUnit?: ItemUnit; // Measurement unit per individual item (e.g., "G" for grams)
  itemsPerUnit?: number; // Integer - number of items contained in each unit (e.g., 25 items per unit)
  expiryDate?: string | Date; // Date - expiry date of the product
  category?: {
    id: number;
    title: string;
    image: string;
  };
  subCategory?: {
    id: number;
    title: string;
    image: string;
  };
  brand?: {
    id: number;
    name: string;
    logo?: string;
  } | null;
  brandId?: number; // For form submission
  concurrencyStamp?: string;
  createdAt?: string;
  created_at?: string; // API returns snake_case
}

export interface ProductListResponse {
  success: boolean;
  doc: Product[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    paginationEnabled: boolean;
  };
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: string | number;
  sellingPrice: string | number;
  quantity: string | number; // Required for create, integer >= 0
  units: string;
  categoryId: string | number;
  subCategoryId: string | number;
  branchId: string | number;
  vendorId: string | number;
  status: ProductStatus;
  brandId?: string | number;
  file: File;
  // New/Updated fields
  itemQuantity?: string | number; // Optional, decimal >= 0
  itemUnit?: ItemUnit; // Optional, must be one of 32 valid enum values
  itemsPerUnit?: string | number; // Optional, integer >= 1
  expiryDate: string | Date; // Required for create, valid date
}

export interface CreateProductResponse {
  success: boolean;
  message?: string;
  doc?: Product;
}

export interface UpdateProductRequest {
  title: string;
  description: string;
  price: string | number;
  sellingPrice: string | number;
  quantity?: string | number; // Optional for update, integer >= 0
  units: string;
  updatedBy: string | number;
  concurrencyStamp: string;
  brandId?: string | number;
  file?: File; // Optional for updates
  // New/Updated fields
  itemQuantity?: string | number; // Optional, decimal >= 0
  itemUnit?: ItemUnit; // Optional, must be one of 32 valid enum values
  itemsPerUnit?: string | number; // Optional, integer >= 1
  expiryDate?: string | Date; // Optional for update, valid date
}

export interface UpdateProductResponse {
  success: boolean;
  message?: string;
  doc?: Product;
}

