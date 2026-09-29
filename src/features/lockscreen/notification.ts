import { buildWidgetState } from '@/features/widget/buildWidgetState';
import { buildLockscreenContent } from '@/features/lockscreen/content';
import { currentLocalTime } from '@/features/timeline/time';

// v2: Android freezes a channel's importance at creation time — bumping the
// code from MIN to LOW importance does nothing for anyone who already has the
// old "lockscreen-timeline" channel on their device (that's the whole reason
// this never rendered anywhere). A new id forces a fresh channel instead of
// silently no-opping against the stale one.
const CHANNEL_ID = 'lockscreen-timeline-v2';
const NOTIFICATION_ID = 'lockscreen-timeline';

// Dynamically imported, not statically at the top of this file: every
// statically-imported module is evaluated when the app's JS bundle boots
// (RN bundles the whole app together — a screen not being open yet doesn't
// stop its imports from running), not only when its screen actually opens.
// Notifee's own native-module binding must not run before the app has
// finished starting, so it's loaded lazily on first real use instead.
async function loadNotifee() {
  return import('@notifee/react-native');
}

// LOW importance is silent (no sound, no heads-up popup) but still renders in
// the shade and on the lock screen — MIN goes a step further and hides the
// notification everywhere except the manually-expanded "silent" shade
// section, which is why it never showed up at all. PUBLIC visibility is what
// puts its content on the lock screen without unlocking, once it's actually
// allowed to render there.
async function ensureChannel(notifee: Awaited<ReturnType<typeof loadNotifee>>): Promise<void> {
  await notifee.default.createChannel({
    id: CHANNEL_ID,
    name: 'Timeline (lock screen)',
    importance: notifee.AndroidImportance.LOW,
    visibility: notifee.AndroidVisibility.PUBLIC,
  });
}

export async function requestLockscreenNotificationPermission(): Promise<boolean> {
  const notifee = await loadNotifee();
  const settings = await notifee.default.requestPermission();
  return settings.authorizationStatus === notifee.AuthorizationStatus.AUTHORIZED;
}

// Called on toggle-on and from the background task — refetches today's
// now/next and re-displays the same notification id, so it updates in place
// instead of stacking duplicates.
export async function refreshLockscreenNotification(): Promise<void> {
  const notifee = await loadNotifee();
  await ensureChannel(notifee);
  const state = await buildWidgetState('lockscreen_refresh');
  const content = buildLockscreenContent(state, currentLocalTime());

  await notifee.default.displayNotification({
    id: NOTIFICATION_ID,
    title: content.title,
    body: content.body,
    android: {
      channelId: CHANNEL_ID,
      ongoing: true,
      autoCancel: false,
      visibility: notifee.AndroidVisibility.PUBLIC,
      pressAction: { id: 'default', launchActivity: 'default' },
      style: { type: notifee.AndroidStyle.BIGTEXT, text: content.bigText },
    },
  });
}

export async function clearLockscreenNotification(): Promise<void> {
  const notifee = await loadNotifee();
  await notifee.default.cancelNotification(NOTIFICATION_ID);
}
