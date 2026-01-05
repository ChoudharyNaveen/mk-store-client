/**
 * Product related types
 */

export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type ProductStatusType = 'INSTOCK' | 'OUTOFSTOCK';

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
  brand: string | null;
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
  quantity: string | number;
  units: string;
  categoryId: string | number;
  subCategoryId: string | number;
  branchId: string | number;
  vendorId: string | number;
  status: ProductStatus;
  brandId?: string | number;
  file: File;
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
  quantity: string | number;
  units: string;
  updatedBy: string | number;
  concurrencyStamp: string;
  brandId?: string | number;
  file?: File; // Optional for updates
}

export interface UpdateProductResponse {
  success: boolean;
  message?: string;
  doc?: Product;
}

