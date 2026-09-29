import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { isLockscreenTimelineEnabled } from '@/features/lockscreen/prefs';
import { logEvent } from '@/lib/logging/logger';

export const LOCKSCREEN_BACKGROUND_TASK = 'lockscreen-timeline-refresh';

// Defined at module scope and imported from index.js — same constraint as
// registerWidgetTaskHandler (see index.js): it must exist outside the React
// tree so Android can invoke it headlessly while the app isn't open.
//
// Wrapped in try/catch: this runs during the app's synchronous boot import
// chain (before anything renders), so a failure here must not take down the
// whole app — it already did exactly that once. Worst case, this one feature
// is unavailable for the session instead of the app not starting at all.
try {
  TaskManager.defineTask(LOCKSCREEN_BACKGROUND_TASK, async () => {
    if (!(await isLockscreenTimelineEnabled())) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    try {
      // Lazy: pulls in @notifee/react-native, which must not be touched
      // during the boot import chain — see notification.ts's own comment.
      const { refreshLockscreenNotification } = await import('@/features/lockscreen/notification');
      await refreshLockscreenNotification();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      logEvent('lockscreen_background_task', 'failure', { detail: String(error) });
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
} catch (error) {
  logEvent('lockscreen_background_task_register', 'failure', { detail: String(error) });
}

// registerTaskAsync's registration survives app restarts on its own (it's
// persisted by the OS) — this only needs to run once, when the user flips the
// Settings toggle on.
export async function registerLockscreenBackgroundTask(): Promise<void> {
  // 15 min is the Android WorkManager floor — the OS still treats it as a
  // minimum and batches wakeups, same as the widget's 30 min ceiling (006).
  await BackgroundTask.registerTaskAsync(LOCKSCREEN_BACKGROUND_TASK, { minimumInterval: 15 });
}

export async function unregisterLockscreenBackgroundTask(): Promise<void> {
  await BackgroundTask.unregisterTaskAsync(LOCKSCREEN_BACKGROUND_TASK);
}
