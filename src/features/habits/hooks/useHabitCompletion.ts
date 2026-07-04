import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';

// FR-002: idempotent complete (upsert, no-op on a same-day double-tap) and undo
// (delete). No `completed` boolean is tracked client-side — presence of the row is
// the source of truth (data-model.md).
export function useHabitCompletion() {
  async function complete(habitId: string, completedOn: string) {
    const { error } = await supabase
      .from('habit_completions')
      .upsert({ habit_id: habitId, completed_on: completedOn }, { onConflict: 'habit_id,completed_on', ignoreDuplicates: true });
    logEvent('habit_complete', error ? 'failure' : 'success', { detail: error?.message });
    return { ok: !error };
  }

  async function undo(habitId: string, completedOn: string) {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .match({ habit_id: habitId, completed_on: completedOn });
    logEvent('habit_undo', error ? 'failure' : 'success', { detail: error?.message });
    return { ok: !error };
  }

  return { complete, undo };
}
