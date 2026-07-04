import { useEffect, useState } from 'react';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { logEvent } from '@/lib/logging/logger';

export type PurchaseResult = { ok: true } | { ok: false; message: string };
export type RestoreResult = { ok: true; restored: boolean } | { ok: false; message: string };

// FR-001: the available plan(s) to show on the subscription screen.
export function useOfferingPackages() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Purchases.getOfferings()
      .then((offerings) => {
        setPackages(offerings.current?.availablePackages ?? []);
      })
      .catch((error: Error) => {
        logEvent('offerings_fetch', 'failure', { detail: error.message });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { packages, isLoading };
}

export function usePurchase() {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // FR-002/FR-009: the platform's native purchase flow; a cancelled or failed
  // attempt always returns a clear message, never a silent failure.
  async function purchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
    setIsPurchasing(true);
    try {
      await Purchases.purchasePackage(pkg);
      logEvent('purchase_attempt', 'success');
      return { ok: true };
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean; message?: string };
      if (purchaseError.userCancelled) {
        logEvent('purchase_attempt', 'failure', { detail: 'user_cancelled' });
        return { ok: false, message: 'Purchase cancelled.' };
      }
      logEvent('purchase_attempt', 'failure', { detail: purchaseError.message });
      return { ok: false, message: "Couldn't complete the purchase. Please try again." };
    } finally {
      setIsPurchasing(false);
    }
  }

  // FR-003/FR-009: restoring with nothing to restore is a normal outcome, not an
  // error (quickstart.md Scenario 2) — the caller gets to tell them apart.
  async function restore(): Promise<RestoreResult> {
    setIsRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const restored = Object.keys(customerInfo.entitlements.active).length > 0;
      logEvent('restore_attempt', 'success', { detail: restored ? 'restored' : 'nothing_to_restore' });
      return { ok: true, restored };
    } catch (error) {
      logEvent('restore_attempt', 'failure', { detail: (error as Error).message });
      return { ok: false, message: "Couldn't restore purchases. Please try again." };
    } finally {
      setIsRestoring(false);
    }
  }

  return { purchase, restore, isPurchasing, isRestoring };
}
