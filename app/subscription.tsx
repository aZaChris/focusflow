import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { useOfferingPackages, usePurchase } from '@/features/subscription/hooks/usePurchase';
import { logEvent } from '@/lib/logging/logger';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';
import { Screen, Title, Button, ErrorText, MutedText, FoxMark, Icon } from '@/components/ui';

const FEATURES = ['Unlimited journal history', 'Advanced mood analytics', 'Custom habit reminders', 'Priority support'];

// Real packages, not the handoff's hardcoded Monthly/Annual — "SAVE X%" only
// shown when the offering actually has both a monthly and annual package to
// compare (computed from real prices, never a fabricated percentage).
function savingsBadge(packages: PurchasesPackage[]): string | null {
  const monthly = packages.find((p) => p.packageType === 'MONTHLY');
  const annual = packages.find((p) => p.packageType === 'ANNUAL');
  if (!monthly || !annual) return null;
  const annualMonthlyEquivalent = annual.product.price / 12;
  const savings = 1 - annualMonthlyEquivalent / monthly.product.price;
  return savings > 0 ? `SAVE ${Math.round(savings * 100)}%` : null;
}

export default function SubscriptionScreen() {
  const entitlement = useEntitlement();
  const { packages, isLoading: isLoadingPackages } = useOfferingPackages();
  const { purchase, restore, isPurchasing, isRestoring } = usePurchase();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = packages.find((p) => p.identifier === selectedId) ?? packages.find((p) => p.packageType === 'ANNUAL') ?? packages[0];
  const badge = savingsBadge(packages);

  async function handleContinue() {
    setError(null);
    setNotice(null);
    if (!selected) return;
    const result = await purchase(selected);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.back();
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
  // Play Store) — not something FocusFlow builds itself (Principle II).
  async function handleManage() {
    setError(null);
    try {
      await Purchases.showManageSubscriptions();
      logEvent('manage_subscription_open', 'success');
    } catch (err) {
      logEvent('manage_subscription_open', 'failure', { detail: (err as Error).message });
      setError("Couldn't open subscription management. Please try again.");
    }
  }

  return (
    <Screen>
      <Pressable style={styles.closeButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
        <Icon name="x" size={18} color={color.text} />
      </Pressable>

      <View style={styles.header}>
        <FoxMark size={56} />
        <Title style={styles.title}>FocusFlow Pro</Title>
        <MutedText>Unlock the full experience</MutedText>
      </View>

      {entitlement.isLoading ? null : entitlement.isActive ? (
        <View style={styles.tabGap}>
          <Text style={styles.statusTitle}>Active — {entitlement.productIdentifier}</Text>
          <MutedText>{entitlement.willRenew ? `Renews on ${entitlement.expirationDate}` : `Expires on ${entitlement.expirationDate}`}</MutedText>
          <Pressable style={styles.manageButton} onPress={handleManage} accessibilityRole="button" accessibilityLabel="Manage subscription">
            <Text style={styles.manageButtonText}>Manage subscription</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.tabGap}>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.checkBadge}>
                <Icon name="check" size={12} color={color.primary} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}

          {!isLoadingPackages && packages.length === 0 ? (
            <MutedText>No plans are available right now.</MutedText>
          ) : (
            packages.map((pkg) => {
              const isSelected = pkg.identifier === selected?.identifier;
              return (
                <Pressable
                  key={pkg.identifier}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                  onPress={() => setSelectedId(pkg.identifier)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={pkg.product.title}
                >
                  <View style={[styles.radioDot, isSelected && styles.radioDotSelected]} />
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{pkg.product.title}</Text>
                    <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                  </View>
                  {pkg.packageType === 'ANNUAL' && badge ? (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>{badge}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}

          <Button title={isPurchasing ? 'Processing…' : 'Continue'} onPress={handleContinue} disabled={isPurchasing || !selected} accessibilityLabel="Continue" />
        </View>
      )}

      <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring} accessibilityRole="button" accessibilityLabel="Restore purchases">
        <Text style={styles.restoreButtonText}>{isRestoring ? 'Restoring…' : 'Restore purchases'}</Text>
      </Pressable>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {notice ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}

      <MutedText style={styles.footer}>Cancel anytime. Terms apply.</MutedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  closeButton: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: color.borderLight, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  title: { fontSize: fontSize.xl },
  tabGap: { gap: spacing.sm },
  statusTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: color.text },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkBadge: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: color.primaryTint, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: font.regular, color: color.text, fontSize: fontSize.base },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  planCardSelected: { borderColor: color.primary },
  radioDot: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 2, borderColor: color.border },
  radioDotSelected: { borderColor: color.primary, backgroundColor: color.primary },
  planInfo: { flex: 1 },
  planTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: color.text },
  planPrice: { fontSize: fontSize.lg, fontFamily: font.bold, color: color.text },
  saveBadge: { backgroundColor: color.primaryTint, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  saveBadgeText: { color: color.primary, fontFamily: font.bold, fontSize: fontSize.sm },
  notice: { color: color.success, fontFamily: font.regular },
  restoreButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: 8 },
  restoreButtonText: { color: color.textSecondary, textDecorationLine: 'underline', fontFamily: font.regular },
  manageButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 4 },
  manageButtonText: { color: color.primary, textDecorationLine: 'underline', fontFamily: font.semibold },
  footer: { textAlign: 'center' },
});
