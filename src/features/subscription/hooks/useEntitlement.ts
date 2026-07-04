import { useCallback, useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';
import { getEntitlementStatus, type EntitlementStatus } from '@/features/subscription/entitlement';
import { logEvent } from '@/lib/logging/logger';

// The entitlement identifier configured in the RevenueCat dashboard (data-model.md).
export const ENTITLEMENT_ID = 'premium';

const emptyStatus: EntitlementStatus = {
  isActive: false,
  willRenew: false,
  expirationDate: null,
  productIdentifier: null,
};

// FR-004/FR-005: always reads through to RevenueCat's live CustomerInfo — never a
// value cached by this app — and stays current via the update listener.
export function useEntitlement() {
  const [status, setStatus] = useState<EntitlementStatus>(emptyStatus);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setStatus(getEntitlementStatus(customerInfo, ENTITLEMENT_ID));
    } catch (error) {
      logEvent('entitlement_check', 'failure', { detail: (error as Error).message });
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));

    const listener = (customerInfo: import('react-native-purchases').CustomerInfo) => {
      setStatus(getEntitlementStatus(customerInfo, ENTITLEMENT_ID));
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [refresh]);

  return { ...status, isLoading, refresh };
}
