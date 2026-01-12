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

export interface ProductVariant {
  id: number;
  variant_name: string;
  variant_type: string;
  variant_value: string | null;
  price: number;
  selling_price: number;
  quantity: number;
  items_per_unit?: number | null;
  units?: string | null;
  item_quantity: number | null;
  item_unit: string | null;
  expiry_date: string | Date | null;
  product_status: ProductStatusType;
  status: ProductStatus;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_default: boolean;
  display_order: number;
  variant_id: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  status: ProductStatus;
  nutritional: string | null;
  concurrency_stamp?: string;
  created_at?: string; // API returns snake_case
  createdAt?: string;
  // Variants array (new structure)
  variants: ProductVariant[];
  // Images array (new structure)
  images: ProductImage[];
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
  // Legacy fields for backward compatibility (will use first variant data)
  price?: number;
  selling_price?: number;
  quantity?: number;
  image?: string;
  product_status?: ProductStatusType;
  units?: string;
  itemQuantity?: number;
  itemUnit?: ItemUnit;
  itemsPerUnit?: number;
  expiryDate?: string | Date;
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
  categoryId: string | number;
  subCategoryId: string | number;
  branchId: string | number;
  vendorId: string | number;
  status: ProductStatus;
  brandId?: string | number;
  nutritional?: string | null;
  images: File[];
  variants: Array<{
    variantName: string;
    variantType: string;
    variantValue?: string;
    price: number;
    sellingPrice: number;
    quantity: number;
    itemsPerUnit?: number;
    units?: string;
    itemQuantity?: number;
    itemUnit?: string;
    expiryDate?: string;
    status: ProductStatus;
  }>;
}

export interface CreateProductResponse {
  success: boolean;
  message?: string;
  doc?: Product;
}

export interface UpdateProductRequest {
  title: string;
  description: string;
  updatedBy: string | number;
  concurrencyStamp: string;
  brandId?: string | number;
  nutritional?: string | null;
  images?: File[]; // Optional for updates
  variants: Array<{
    variantName: string;
    variantType: string;
    variantValue?: string;
    price: number;
    sellingPrice: number;
    quantity: number;
    itemsPerUnit?: number;
    units?: string;
    itemQuantity?: number;
    itemUnit?: string;
    expiryDate?: string;
    status: ProductStatus;
  }>;
}

export interface UpdateProductResponse {
  success: boolean;
  message?: string;
  doc?: Product;
}

