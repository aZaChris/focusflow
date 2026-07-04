import type { CustomerInfo } from 'react-native-purchases';

// FR-004/FR-005: the one shared mechanism any feature uses to check entitlement —
// always derived live from CustomerInfo, never a cached flag (data-model.md).
export function hasActiveEntitlement(customerInfo: CustomerInfo, entitlementId: string): boolean {
  return entitlementId in customerInfo.entitlements.active;
}

export interface EntitlementStatus {
  isActive: boolean;
  willRenew: boolean;
  expirationDate: string | null;
  productIdentifier: string | null;
}

// FR-006: the status shown on the subscription screen.
export function getEntitlementStatus(customerInfo: CustomerInfo, entitlementId: string): EntitlementStatus {
  const active = customerInfo.entitlements.active[entitlementId];
  if (!active) {
    return { isActive: false, willRenew: false, expirationDate: null, productIdentifier: null };
  }
  return {
    isActive: true,
    willRenew: active.willRenew,
    expirationDate: active.expirationDate,
    productIdentifier: active.productIdentifier,
  };
}
