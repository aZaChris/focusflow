import * as SecureStore from 'expo-secure-store';

// Reuses expo-secure-store (already a dependency for auth) rather than adding
// a storage library just for one boolean — see 004/005 research notes on not
// introducing a dependency a few lines already cover.
const KEY = 'lockscreen_timeline_enabled';

export async function isLockscreenTimelineEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY)) === 'true';
}

export async function setLockscreenTimelineEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY, enabled ? 'true' : 'false');
}
