import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { getEnabled } from '@/features/lockscreen/lockscreenPreference';
import { postLockscreenNotification, withdrawLockscreenNotification } from '@/features/lockscreen/lockscreenNotification';

// research.md §3: independent of 006's widget refresh cycle (which only fires
// when a widget is actually pinned) — this task keeps the lock-screen
// notification current whether or not the home-screen widget is added.
export const TASK_NAME = 'lockscreen-timeline-refresh';

TaskManager.defineTask(TASK_NAME, async () => {
  const enabled = await getEnabled();
  if (!enabled) {
    await withdrawLockscreenNotification();
    return BackgroundTask.BackgroundTaskResult.Success;
  }
  await postLockscreenNotification();
  return BackgroundTask.BackgroundTaskResult.Success;
});

// FR-004/SC-002: WorkManager's own minimum interval (15 min) comfortably
// inside this feature's inherited 30-minute bound.
export async function registerLockscreenRefreshTask(): Promise<void> {
  await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 15 });
}
