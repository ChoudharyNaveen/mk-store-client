/**
 * Branch shipping configuration types
 * Used for Settings > Shipping Charges
 */

export interface BranchShippingConfigBranch {
  id: number;
  name: string;
  vendorId: number;
}

export interface BranchShippingConfig {
  id: number;
  branchId: number;
  distanceThresholdKm: number;
  withinThresholdBaseCharge: number;
  withinThresholdFreeAbove: number;
  aboveThresholdSamedayBaseCharge: number;
  aboveThresholdSamedayDiscountedCharge: number;
  aboveThresholdSamedayFreeAbove: number;
  aboveThresholdNextdayBaseCharge: number;
  aboveThresholdNextdayFreeAbove: number;
  status: string;
  concurrencyStamp: string;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  branch?: BranchShippingConfigBranch;
}

export interface BranchShippingConfigResponse {
  success: boolean;
  doc: BranchShippingConfig;
}

/** Request body for POST save-branch-shipping-config (create and update) */
export interface SaveBranchShippingConfigRequest {
  branchId: number;
  distanceThresholdKm: number;
  withinThresholdBaseCharge: number;
  withinThresholdFreeAbove: number;
  aboveThresholdSamedayBaseCharge: number;
  aboveThresholdSamedayDiscountedCharge: number;
  aboveThresholdSamedayFreeAbove: number;
  aboveThresholdNextdayBaseCharge: number;
  aboveThresholdNextdayFreeAbove: number;
}
