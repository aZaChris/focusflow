import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Purchases from 'react-native-purchases';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { useOfferingPackages, usePurchase } from '@/features/subscription/hooks/usePurchase';
import { logEvent } from '@/lib/logging/logger';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

const FEATURES = [
  'Unlimited journal history',
  'Advanced mood analytics',
  'Custom habit reminders',
  'Priority support',
];

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const entitlement = useEntitlement();
  const { packages, isLoading: isLoadingPackages } = useOfferingPackages();
  const { purchase, restore, isPurchasing, isRestoring } = usePurchase();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const s = makeStyles(theme);

  async function handlePurchase() {
    setError(null);
    setNotice(null);
    const pkg = packages[selectedIndex] ?? packages[0];
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
    <View style={s.container}>
      <Pressable style={s.closeButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
        <Text style={s.closeIcon}>✕</Text>
      </Pressable>

      <View style={s.icon}>
        <Image source={require('@/assets/images/fox-icon.png')} style={s.iconImage} resizeMode="contain" />
      </View>
      <Text style={s.title}>Foxus Pro</Text>
      <Text style={s.subtitle}>Unlock the full toolkit for a calmer, more focused day.</Text>

      {entitlement.isLoading ? null : entitlement.isActive ? (
        <View style={s.statusCard}>
          <Text style={s.statusTitle}>Active — {entitlement.productIdentifier}</Text>
          <Text style={s.statusDetail}>
            {entitlement.willRenew ? `Renews on ${entitlement.expirationDate}` : `Expires on ${entitlement.expirationDate}`}
          </Text>
          <Pressable style={s.manageButton} onPress={handleManage} accessibilityRole="button" accessibilityLabel="Manage subscription">
            <Text style={s.manageButtonText}>Manage subscription</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {FEATURES.map((f) => (
            <View key={f} style={s.featureRow}>
              <View style={s.checkBadge}>
                <Text style={s.checkBadgeIcon}>✓</Text>
              </View>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}

          {!isLoadingPackages && packages.length === 0 ? (
            <Text style={s.empty}>No plans are available right now.</Text>
          ) : (
            packages.map((pkg, i) => (
              <Pressable
                key={pkg.identifier}
                style={[s.planCard, selectedIndex === i && s.planCardSelected]}
                onPress={() => setSelectedIndex(i)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedIndex === i }}
              >
                <View style={[s.radioDot, selectedIndex === i && s.radioDotSelected]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.planTitle}>{pkg.product.title}</Text>
                  <Text style={s.planPrice}>{pkg.product.priceString}</Text>
                </View>
              </Pressable>
            ))
          )}

          {packages.length > 0 && (
            <Pressable style={s.button} onPress={handlePurchase} disabled={isPurchasing} accessibilityRole="button" accessibilityLabel="Continue">
              <Text style={s.buttonText}>{isPurchasing ? 'Processing…' : 'Continue'}</Text>
            </Pressable>
          )}
          <Text style={s.footnote}>Cancel anytime. Terms apply.</Text>
        </>
      )}

      <Pressable style={s.restoreButton} onPress={handleRestore} disabled={isRestoring} accessibilityRole="button" accessibilityLabel="Restore purchases">
        <Text style={s.restoreButtonText}>{isRestoring ? 'Restoring…' : 'Restore purchases'}</Text>
      </Pressable>

      {error ? (
        <Text style={s.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text style={s.notice} accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: spacing.screenX, gap: 12, backgroundColor: theme.background },
    closeButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: theme.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    closeIcon: { color: theme.textSecondary, fontWeight: '700' },
    icon: { width: 56, height: 56, borderRadius: radii.icon, backgroundColor: theme.darkSurface, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    iconImage: { width: 56, height: 56 },
    title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary, textAlign: 'center' },
    subtitle: { color: theme.textSecondary, textAlign: 'center' },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
    checkBadgeIcon: { color: theme.primary, fontSize: 12, fontWeight: '700' },
    featureText: { color: theme.textPrimary, fontSize: 14 },
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: radii.card - 4,
      padding: 14,
      backgroundColor: theme.surface,
    },
    planCardSelected: { borderColor: theme.primary },
    radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.border },
    radioDotSelected: { borderColor: theme.primary, backgroundColor: theme.primary },
    planTitle: { fontWeight: '600', color: theme.textPrimary },
    planPrice: { color: theme.textSecondary, fontSize: 13 },
    statusCard: { borderRadius: radii.card - 4, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 16, gap: 4 },
    statusTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
    statusDetail: { color: theme.textSecondary },
    button: { backgroundColor: theme.primary, borderRadius: radii.input, padding: 14, alignItems: 'center' },
    buttonText: { color: theme.surface, fontWeight: '700' },
    error: { color: theme.error },
    notice: { color: theme.primary },
    empty: { color: theme.textMuted },
    footnote: { color: theme.textMuted, fontSize: 12, textAlign: 'center' },
    restoreButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: 8 },
    restoreButtonText: { color: theme.textSecondary, textDecorationLine: 'underline' },
    manageButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 4 },
    manageButtonText: { color: theme.textPrimary, textDecorationLine: 'underline', fontWeight: '600' },
  });
}
