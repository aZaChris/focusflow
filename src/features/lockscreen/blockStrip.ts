import type { WidgetState } from '@/features/widget/widgetState';

// data-model.md: the "block strip" visual — current activity fixed at the
// center, upcoming/info blocks in order. `getBlocks` is the structured shape
// shared by the notification's text rendering (formatBlockStrip) and the
// full in-app visual (LockscreenTimelineView) — research.md §2.
export type Block = { kind: 'current' | 'next' | 'info'; label: string };

export function getBlocks(state: WidgetState): Block[] {
  switch (state.kind) {
    case 'signed_out':
      return [{ kind: 'info', label: 'Sign in to see your schedule' }];
    case 'empty':
      return [{ kind: 'info', label: 'Nothing scheduled today' }];
    case 'current_and_next':
      return [
        { kind: 'current', label: state.current.title },
        { kind: 'next', label: state.next.title },
      ];
    case 'current_only':
      return [
        { kind: 'current', label: state.current.title },
        { kind: 'info', label: 'Nothing else today' },
      ];
    case 'next_only':
      return [
        { kind: 'info', label: 'Nothing right now' },
        { kind: 'next', label: state.next.title },
      ];
    case 'nothing_left':
      return [{ kind: 'info', label: 'Nothing scheduled right now' }];
  }
}

// research.md §2: text/glyph representation for the lock-screen notification
// (BigTextStyle-compatible) — no rasterized image, avoiding the upstream
// expo-notifications BigPictureStyle bug.
export function formatBlockStrip(state: WidgetState): string {
  return getBlocks(state)
    .map((block) => {
      if (block.kind === 'current') return `▸ Now: ${block.label}`;
      if (block.kind === 'next') return `Next: ${block.label}`;
      return block.label;
    })
    .join('  →  ');
}
