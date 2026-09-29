import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/features/auth/hooks/useSession';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { useMfa } from '@/features/auth/hooks/useMfa';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { isLockscreenTimelineEnabled, setLockscreenTimelineEnabled } from '@/features/lockscreen/prefs';
import {
  requestLockscreenNotificationPermission,
  refreshLockscreenNotification,
  clearLockscreenNotification,
} from '@/features/lockscreen/notification';
import { registerLockscreenBackgroundTask, unregisterLockscreenBackgroundTask } from '@/features/lockscreen/backgroundTask';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

type MfaStep = 'idle' | 'enrolling' | 'backup-codes' | 'enabled' | 'disabling';

export default function SettingsScreen() {
  const { theme, scheme, setScheme } = useTheme();
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
  const [lockscreenBusy, setLockscreenBusy] = useState(false);
  // handoff §6: local boolean only — no notification-scheduling feature to wire it to yet.
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    isLockscreenTimelineEnabled().then(setLockscreenEnabled);
  }, []);

  async function toggleLockscreenTimeline(next: boolean) {
    setLockscreenBusy(true);
    setError(null);
    try {
      if (next) {
        const granted = await requestLockscreenNotificationPermission();
        if (!granted) {
          setError('Serve il permesso notifiche per mostrare la timeline sul lock screen.');
          return;
        }
        await setLockscreenTimelineEnabled(true);
        await refreshLockscreenNotification();
        await registerLockscreenBackgroundTask();
      } else {
        await setLockscreenTimelineEnabled(false);
        await clearLockscreenNotification();
        await unregisterLockscreenBackgroundTask();
      }
      setLockscreenEnabled(next);
    } catch {
      setError('Non è stato possibile aggiornare la timeline sul lock screen. Riprova.');
    } finally {
      setLockscreenBusy(false);
    }
  }

  function confirmDelete() {
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

  const s = makeStyles(theme);
  const initials = (session?.user.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <View style={s.scroll}>
      <Text style={s.title}>Settings</Text>

      <View style={s.profileRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.email}>{session?.user.email}</Text>
        </View>
        <View style={[s.badge, entitlement.isActive && s.badgeActive]}>
          <Text style={[s.badgeText, entitlement.isActive && s.badgeTextActive]}>{entitlement.isActive ? 'Pro' : 'Free'}</Text>
        </View>
      </View>

      {!entitlement.isActive && (
        <Pressable style={s.upgradeRow} onPress={() => router.push('/(tabs)/subscription')} accessibilityRole="button">
          <Text style={s.upgradeText}>Upgrade to Pro</Text>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      )}

      <Text style={s.sectionTitle}>Preferences</Text>
      <View style={s.prefRow}>
        <Text style={s.prefLabel}>Notifications</Text>
        <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} accessibilityLabel="Notifications" />
      </View>
      <View style={s.prefRow}>
        <Text style={s.prefLabel}>Dark mode</Text>
        <Switch value={scheme === 'dark'} onValueChange={(v) => setScheme(v ? 'dark' : 'light')} accessibilityLabel="Dark mode" />
      </View>
      <View style={s.prefRow}>
        <Text style={s.prefLabel}>Timeline sul lock screen</Text>
        <Switch value={lockscreenEnabled} onValueChange={toggleLockscreenTimeline} disabled={lockscreenBusy} accessibilityLabel="Timeline sul lock screen" />
      </View>

      <Text style={s.sectionTitle}>Support</Text>
      <View style={s.supportRow}>
        <Text style={s.prefLabel}>Help center</Text>
        <Text style={s.chevron}>›</Text>
      </View>
      <View style={s.supportRow}>
        <Text style={s.prefLabel}>Privacy policy</Text>
        <Text style={s.chevron}>›</Text>
      </View>

      <Text style={s.sectionTitle}>Account</Text>
      {mfaStep === 'idle' && (
        <Pressable style={s.button} onPress={startEnroll} disabled={isBusy}>
          <Text style={s.buttonText}>Enable 2FA</Text>
        </Pressable>
      )}
      {mfaStep === 'enrolling' && (
        <>
          <Text style={s.prefLabel}>Add this secret to your authenticator app:</Text>
          <Text selectable style={s.secret}>{secret}</Text>
          <TextInput style={s.input} placeholder="6-digit code" placeholderTextColor={theme.textMuted} keyboardType="number-pad" value={code} onChangeText={setCode} />
          <Pressable style={s.button} onPress={confirmEnroll} disabled={isBusy}>
            <Text style={s.buttonText}>Confirm</Text>
          </Pressable>
        </>
      )}
      {mfaStep === 'backup-codes' && (
        <>
          <Text style={s.prefLabel}>Save these backup codes — shown only once:</Text>
          {backupCodes.map((c) => (
            <Text key={c} selectable style={s.secret}>{c}</Text>
          ))}
          <Pressable style={s.button} onPress={() => setMfaStep('enabled')}>
            <Text style={s.buttonText}>Done</Text>
          </Pressable>
        </>
      )}
      {mfaStep === 'enabled' && (
        <Pressable style={s.deleteButton} onPress={() => setMfaStep('disabling')}>
          <Text style={s.buttonText}>Disable 2FA</Text>
        </Pressable>
      )}
      {mfaStep === 'disabling' && (
        <>
          <Text style={s.prefLabel}>Enter a current code to confirm disabling 2FA:</Text>
          <TextInput style={s.input} placeholder="6-digit code" placeholderTextColor={theme.textMuted} keyboardType="number-pad" value={code} onChangeText={setCode} />
          <Pressable style={s.deleteButton} onPress={confirmDisable} disabled={isBusy}>
            <Text style={s.buttonText}>Confirm disable</Text>
          </Pressable>
        </>
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable style={s.logoutButton} onPress={signOut}>
        <Text style={s.logoutButtonText}>Log out</Text>
      </Pressable>
      <Pressable style={s.deleteButton} onPress={confirmDelete} disabled={isDeleting}>
        <Text style={s.buttonText}>{isDeleting ? 'Deleting…' : 'Delete account'}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scroll: { flex: 1, paddingTop: 60, paddingHorizontal: spacing.screenX, gap: 10, backgroundColor: theme.background },
    title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.primary, fontWeight: '700' },
    email: { color: theme.textPrimary, fontWeight: '600' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: theme.surfaceAlt },
    badgeActive: { backgroundColor: theme.primary },
    badgeText: { color: theme.textMuted, fontSize: 12, fontWeight: '700' },
    badgeTextActive: { color: theme.surface },
    upgradeRow: { backgroundColor: theme.darkSurface, borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    upgradeText: { color: '#fff', fontWeight: '700' },
    chevron: { color: theme.textMuted, fontSize: 18 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.textMuted, marginTop: 16, textTransform: 'uppercase' },
    prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    prefLabel: { color: theme.textPrimary, flex: 1 },
    supportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
    button: { backgroundColor: theme.primary, borderRadius: radii.input, padding: 14, alignItems: 'center' },
    deleteButton: { backgroundColor: theme.error, borderRadius: radii.input, padding: 14, alignItems: 'center', marginTop: 4 },
    logoutButton: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: radii.input, padding: 12, alignItems: 'center', marginTop: 16 },
    logoutButtonText: { color: theme.textSecondary, fontWeight: '600' },
    buttonText: { color: theme.surface, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: radii.input, padding: 12, color: theme.textPrimary, backgroundColor: theme.surface },
    secret: { fontFamily: 'monospace', fontSize: 16, color: theme.textPrimary },
    error: { color: theme.error },
  });
}
