import * as SecureStore from 'expo-secure-store';

// research.md §5: reuses expo-secure-store (already a dependency, already
// persists the auth session) instead of adding a new storage dependency for
// this one boolean. FR-001: defaults to false when nothing is stored yet.
const KEY = 'lockscreen_timeline_enabled';

export async function getEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEY);
  return value === 'true';
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY, enabled ? 'true' : 'false');
}
