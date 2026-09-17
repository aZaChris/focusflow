import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { buildNowNextState } from '@/features/shared/nowNextState';
import { formatBlockStrip, getBlocks } from '@/features/lockscreen/blockStrip';

// Stable IDs so re-posting updates the same notification in place instead of
// stacking duplicates (contracts/lockscreen-contracts.md).
const CHANNEL_ID = 'lockscreen_timeline';
const NOTIFICATION_ID = 'lockscreen_timeline';

async function ensureChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lock screen timeline',
    // LOW: glanceable and passive, never a sound/heads-up interruption (Principle V).
    importance: AndroidImportance.LOW,
    // FR-007/SC-006: PRIVATE visibility means Android itself substitutes a
    // generic placeholder on the lock screen when the device's own
    // hide-sensitive-content setting is active — no custom redaction logic needed.
    lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
  });
}

// research.md §1/§2: ongoing (sticky) notification, text/glyph block-strip
// content — built from the shared now/next derivation, same data 006's
// widget uses (FR-003, FR-003a, FR-013).
export async function postLockscreenNotification(): Promise<void> {
  const state = await buildNowNextState();
  const blocks = getBlocks(state);
  const current = blocks.find((block) => block.kind === 'current');

  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: current ? `Now: ${current.label}` : 'FocusFlow',
      body: formatBlockStrip(state),
      sticky: true, // FR-013: ongoing, cannot be swiped away
      autoDismiss: false,
    },
    trigger: { channelId: CHANNEL_ID }, // null-equivalent: deliver immediately, bound to our channel
  });
}

export async function withdrawLockscreenNotification(): Promise<void> {
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
}
