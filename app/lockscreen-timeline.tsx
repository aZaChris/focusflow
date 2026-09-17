import { useEffect, useState } from 'react';
import { buildNowNextState } from '@/features/shared/nowNextState';
import { LockscreenTimelineView } from '@/features/lockscreen/LockscreenTimelineView';
import type { WidgetState } from '@/features/widget/widgetState';
import { Screen, Title, MutedText } from '@/components/ui';

// FR-003b/FR-014: reachable on its own, independent of whether the
// lock-screen notification toggle is enabled (spec.md, User Story 4).
export default function LockscreenTimelineScreen() {
  const [state, setState] = useState<WidgetState | null>(null);

  useEffect(() => {
    buildNowNextState().then(setState);
  }, []);

  return (
    <Screen>
      <Title>Visual timeline</Title>
      {state ? <LockscreenTimelineView state={state} /> : <MutedText>Loading…</MutedText>}
    </Screen>
  );
}
