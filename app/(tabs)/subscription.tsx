import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { useOfferingPackages, usePurchase } from '@/features/subscription/hooks/usePurchase';
import { logEvent } from '@/lib/logging/logger';

export default function SubscriptionScreen() {
  const entitlement = useEntitlement();
  const { packages, isLoading: isLoadingPackages } = useOfferingPackages();
  const { purchase, restore, isPurchasing, isRestoring } = usePurchase();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handlePurchase() {
    setError(null);
    setNotice(null);
    const pkg = packages[0];
    if (!pkg) return;
    const result = await purchase(pkg);
    if (!result.ok) setError(result.message);
  }

  async function handleRestore() {
    setError(null);
    setNotice(null);
    const result = await restore();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice(result.restored ? 'Your purchase was restored.' : 'Nothing to restore.');
  }

  // FR-007: reach the platform's native subscription management (App Store /
  // Play Store) — not something Foxus builds itself (Principle II).
  async function handleManage() {
    setError(null);
    try {
      await Purchases.showManageSubscriptions();
      logEvent('manage_subscription_open', 'success');
    } catch (error) {
      logEvent('manage_subscription_open', 'failure', { detail: (error as Error).message });
      setError("Couldn't open subscription management. Please try again.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription</Text>

      {entitlement.isLoading ? null : entitlement.isActive ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Active — {entitlement.productIdentifier}</Text>
          <Text style={styles.statusDetail}>
            {entitlement.willRenew
              ? `Renews on ${entitlement.expirationDate}`
              : `Expires on ${entitlement.expirationDate}`}
          </Text>
          <Pressable
            style={styles.manageButton}
            onPress={handleManage}
            accessibilityRole="button"
            accessibilityLabel="Manage subscription"
          >
            <Text style={styles.manageButtonText}>Manage subscription</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.statusDetail}>No active subscription.</Text>
          {!isLoadingPackages && packages.length === 0 ? (
            <Text style={styles.empty}>No plans are available right now.</Text>
          ) : (
            packages.map((pkg) => (
              <View key={pkg.identifier} style={styles.planCard}>
                <Text style={styles.planTitle}>{pkg.product.title}</Text>
                <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                <Pressable
                  style={styles.button}
                  onPress={handlePurchase}
                  disabled={isPurchasing}
                  accessibilityRole="button"
                  accessibilityLabel={`Subscribe to ${pkg.product.title}`}
                >
                  <Text style={styles.buttonText}>{isPurchasing ? 'Processing…' : 'Subscribe'}</Text>
                </Pressable>
              </View>
            ))
          )}
        </>
      )}

      <Pressable
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={isRestoring}
        accessibilityRole="button"
        accessibilityLabel="Restore purchases"
      >
        <Text style={styles.restoreButtonText}>{isRestoring ? 'Restoring…' : 'Restore purchases'}</Text>
      </Pressable>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  statusCard: { borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 16, gap: 4 },
  statusTitle: { fontSize: 16, fontWeight: '600' },
  statusDetail: { color: '#666' },
  planCard: { borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 16, gap: 8 },
  planTitle: { fontSize: 16, fontWeight: '600' },
  planPrice: { fontSize: 20, fontWeight: '700' },
  button: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c00' },
  notice: { color: '#276b3d' },
  empty: { color: '#666' },
  restoreButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: 8 },
  restoreButtonText: { color: '#333', textDecorationLine: 'underline' },
  manageButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 4 },
  manageButtonText: { color: '#111', textDecorationLine: 'underline', fontWeight: '600' },
});
