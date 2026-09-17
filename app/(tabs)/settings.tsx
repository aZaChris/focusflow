import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSession } from '@/features/auth/hooks/useSession';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { useMfa } from '@/features/auth/hooks/useMfa';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { getEnabled, setEnabled } from '@/features/lockscreen/lockscreenPreference';
import { postLockscreenNotification, withdrawLockscreenNotification } from '@/features/lockscreen/lockscreenNotification';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';
import { Screen, ScreenTitle, SectionTitle, TextField, Button, ErrorText, Card, Badge, AvatarInitials, Icon } from '@/components/ui';

type MfaStep = 'idle' | 'enrolling' | 'backup-codes' | 'enabled' | 'disabling';

function SettingsRow({ label, onPress, trailing }: { label: string; onPress?: () => void; trailing?: ReactNode }) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      {trailing ?? (onPress ? <Icon name="chevronRight" size={18} color={color.chevronMuted} /> : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { session, signOut } = useSession();
  const { deleteAccount, isDeleting } = useDeleteAccount();
  const { enroll, verifyFactor, generateBackupCodes, disableMfa, isBusy } = useMfa();
  const entitlement = useEntitlement();
  const [error, setError] = useState<string | null>(null);

  const [mfaStep, setMfaStep] = useState<MfaStep>('idle');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [lockscreenEnabled, setLockscreenEnabled] = useState(false);
  const [lockscreenError, setLockscreenError] = useState<string | null>(null);

  // Handoff's Preferences toggles are explicitly local-only/non-functional in
  // the source prototype ("local boolean state... toggle only, no restyle") —
  // recreated the same way here, not wired to any real behavior.
  const [notifPref, setNotifPref] = useState(true);
  const [darkModePref, setDarkModePref] = useState(false);

  useEffect(() => {
    getEnabled().then(setLockscreenEnabled);
  }, []);

  async function toggleLockscreenTimeline(next: boolean) {
    setLockscreenError(null);
    try {
      if (next) {
        // research.md §6 (007-lockscreen-timeline): Android 13+ requires this
        // runtime permission before any notification can be posted at all.
        const permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) {
          setLockscreenError('Notifications permission is required for the lock-screen timeline. Enable it in your device settings and try again.');
          return;
        }
      }
      await setEnabled(next);
      setLockscreenEnabled(next);
      if (next) await postLockscreenNotification();
      else await withdrawLockscreenNotification();
    } catch (err) {
      setLockscreenError((err as Error).message);
    }
  }

  function confirmDelete() {
    // User Story 5, Acceptance Scenario 1: explicit confirmation before an irreversible action.
    // FR-013 (004-subscription-monetization): deleting the account does not cancel
    // an in-store subscription, which keeps billing until cancelled separately.
    const message = entitlement.isActive
      ? 'This permanently deletes your account and all your data. This cannot be undone. Note: this does NOT cancel your active subscription — cancel it separately from Manage subscription first if you don’t want to keep being billed.'
      : 'This permanently deletes your account and all your data. This cannot be undone.';
    Alert.alert('Delete your account?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          const result = await deleteAccount();
          if (!result.ok) setError(result.message);
        },
      },
    ]);
  }

  async function startEnroll() {
    setError(null);
    const result = await enroll();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFactorId(result.factorId);
    setSecret(result.secret);
    setMfaStep('enrolling');
  }

  async function confirmEnroll() {
    setError(null);
    const result = await verifyFactor(factorId!, code);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCode('');
    // FR-016: backup codes are shown exactly once, right after enabling 2FA.
    const codesResult = await generateBackupCodes();
    if (!codesResult.ok) {
      setError(codesResult.message);
      setMfaStep('enabled');
      return;
    }
    setBackupCodes(codesResult.codes);
    setMfaStep('backup-codes');
  }

  async function confirmDisable() {
    setError(null);
    const result = await disableMfa(factorId!, code);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCode('');
    setFactorId(null);
    setMfaStep('idle');
  }

  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? session?.user.email ?? '';
  const email = session?.user.email ?? '';

  return (
    <Screen>
      <ScreenTitle>Settings</ScreenTitle>

      <View style={styles.profileRow}>
        <AvatarInitials name={name} size={52} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>
            {name || 'Your account'}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {email}
          </Text>
        </View>
        {!entitlement.isLoading ? <Badge label={entitlement.isActive ? 'Pro' : 'Free'} variant={entitlement.isActive ? 'filled' : 'muted'} /> : null}
      </View>

      {!entitlement.isLoading && !entitlement.isActive ? (
        <Pressable style={styles.upgradeRow} onPress={() => router.push('/subscription')} accessibilityRole="button" accessibilityLabel="Upgrade to Pro">
          <Text style={styles.upgradeText}>Upgrade to Pro</Text>
          <Icon name="chevronRight" color={color.onPrimary} size={18} />
        </Pressable>
      ) : null}

      <SectionTitle>Preferences</SectionTitle>
      <Card style={styles.sectionCard}>
        <SettingsRow label="Notifications" trailing={<Switch value={notifPref} onValueChange={setNotifPref} trackColor={{ false: color.border, true: color.primary }} thumbColor={color.surface} accessibilityLabel="Notifications" />} />
        <SettingsRow label="Dark mode" trailing={<Switch value={darkModePref} onValueChange={setDarkModePref} trackColor={{ false: color.border, true: color.primary }} thumbColor={color.surface} accessibilityLabel="Dark mode" />} />
        <SettingsRow
          label="Lock screen timeline"
          trailing={
            <Switch
              value={lockscreenEnabled}
              onValueChange={toggleLockscreenTimeline}
              trackColor={{ false: color.border, true: color.primary }}
              thumbColor={color.surface}
              accessibilityLabel="Show now/next on your lock screen"
            />
          }
        />
      </Card>
      {lockscreenError ? <ErrorText>{lockscreenError}</ErrorText> : null}
      <Button title="View visual timeline" variant="secondary" onPress={() => router.push('/lockscreen-timeline')} />

      <SectionTitle>Security</SectionTitle>
      <Card style={styles.sectionCard}>
        {mfaStep === 'idle' && <SettingsRow label="Two-factor authentication" trailing={<Button title="Enable" onPress={startEnroll} disabled={isBusy} />} />}
        {mfaStep === 'enabled' && <SettingsRow label="Two-factor authentication" trailing={<Button title="Disable" variant="destructive" onPress={() => setMfaStep('disabling')} />} />}
      </Card>
      {mfaStep === 'enrolling' && (
        <View style={styles.tabGap}>
          <Text style={styles.mfaHint}>Add this secret to your authenticator app:</Text>
          <Text selectable style={styles.secret}>
            {secret}
          </Text>
          <TextField placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} />
          <Button title="Confirm" onPress={confirmEnroll} disabled={isBusy} />
        </View>
      )}
      {mfaStep === 'backup-codes' && (
        <View style={styles.tabGap}>
          <Text style={styles.mfaHint}>Save these backup codes — shown only once:</Text>
          {backupCodes.map((c) => (
            <Text key={c} selectable style={styles.secret}>
              {c}
            </Text>
          ))}
          <Button title="Done" onPress={() => setMfaStep('enabled')} />
        </View>
      )}
      {mfaStep === 'disabling' && (
        <View style={styles.tabGap}>
          <Text style={styles.mfaHint}>Enter a current code to confirm disabling 2FA:</Text>
          <TextField placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} />
          <Button title="Confirm disable" variant="destructive" onPress={confirmDisable} disabled={isBusy} />
        </View>
      )}

      <SectionTitle>Support</SectionTitle>
      <Card style={styles.sectionCard}>
        <SettingsRow label="Help center" />
        <SettingsRow label="Privacy policy" />
      </Card>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Button title="Log out" variant="secondary" onPress={signOut} />
      <Button title={isDeleting ? 'Deleting…' : 'Delete account'} variant="destructive" onPress={confirmDelete} disabled={isDeleting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: fontSize.base, fontFamily: font.semibold, color: color.text },
  profileEmail: { fontSize: fontSize.sm, fontFamily: font.regular, color: color.textMuted },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.upgradeCard,
    borderRadius: radius.lg,
    padding: 18,
  },
  upgradeText: { color: color.onPrimary, fontFamily: font.bold, fontSize: fontSize.base },
  sectionCard: { padding: 0, gap: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: 18, minHeight: 44, borderBottomWidth: 1, borderBottomColor: color.borderLight },
  rowLabel: { fontFamily: font.regular, color: color.text, fontSize: fontSize.base },
  tabGap: { gap: spacing.sm },
  mfaHint: { fontFamily: font.regular, color: color.textSecondary },
  secret: { fontFamily: 'monospace', fontSize: fontSize.md },
});
