import { hasActiveEntitlement, getEntitlementStatus } from '@/features/subscription/entitlement';
import type { CustomerInfo } from 'react-native-purchases';

const ENTITLEMENT_ID = 'premium';

function customerInfo(active: Record<string, Partial<CustomerInfo['entitlements']['active'][string]>>): CustomerInfo {
  return {
    entitlements: { active, all: active },
  } as unknown as CustomerInfo;
}

describe('hasActiveEntitlement', () => {
  it('is true when the entitlement is present in active', () => {
    const info = customerInfo({ [ENTITLEMENT_ID]: { identifier: ENTITLEMENT_ID } });
    expect(hasActiveEntitlement(info, ENTITLEMENT_ID)).toBe(true);
  });

  it('is false when the entitlement has expired (absent from active)', () => {
    const info = customerInfo({});
    expect(hasActiveEntitlement(info, ENTITLEMENT_ID)).toBe(false);
  });

  it('is false when a different entitlement is active', () => {
    const info = customerInfo({ other_entitlement: { identifier: 'other_entitlement' } });
    expect(hasActiveEntitlement(info, ENTITLEMENT_ID)).toBe(false);
  });

  it('is false when there are no entitlements at all', () => {
    const info = { entitlements: { active: {}, all: {} } } as unknown as CustomerInfo;
    expect(hasActiveEntitlement(info, ENTITLEMENT_ID)).toBe(false);
  });
});

describe('getEntitlementStatus', () => {
  it('returns isActive true plus renewal/expiration/product details when active', () => {
    const info = customerInfo({
      [ENTITLEMENT_ID]: {
        identifier: ENTITLEMENT_ID,
        willRenew: true,
        expirationDate: '2026-08-04T00:00:00Z',
        productIdentifier: 'foxus_premium_monthly',
      },
    });
    expect(getEntitlementStatus(info, ENTITLEMENT_ID)).toEqual({
      isActive: true,
      willRenew: true,
      expirationDate: '2026-08-04T00:00:00Z',
      productIdentifier: 'foxus_premium_monthly',
    });
  });

  it('returns isActive false with null fields when nothing is active', () => {
    const info = customerInfo({});
    expect(getEntitlementStatus(info, ENTITLEMENT_ID)).toEqual({
      isActive: false,
      willRenew: false,
      expirationDate: null,
      productIdentifier: null,
    });
  });
});
