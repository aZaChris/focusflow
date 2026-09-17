'use no memo';

import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { HexColor } from 'react-native-android-widget';
import type { WidgetState } from '@/features/widget/widgetState';
import { color } from '@/theme/tokens';

function Line({ text, color, bold }: { text: string; color: HexColor; bold?: boolean }) {
  return (
    <TextWidget
      text={text}
      style={{ fontSize: 14, color, fontWeight: bold ? 'bold' : 'normal' }}
      truncate="END"
      maxLines={1}
    />
  );
}

function widgetAccessibilityLabel(state: WidgetState): string {
  switch (state.kind) {
    case 'signed_out':
      return 'Sign in to see your schedule. Tap to open FocusFlow.';
    case 'empty':
      return 'Nothing scheduled today. Tap to open FocusFlow.';
    case 'nothing_left':
      return 'Nothing scheduled right now. Tap to open FocusFlow.';
    case 'current_and_next':
      return `Now: ${state.current.title}. Next: ${state.next.title} at ${state.next.start_time}. Tap to open FocusFlow.`;
    case 'current_only':
      return `Now: ${state.current.title}. Nothing else today. Tap to open FocusFlow.`;
    case 'next_only':
      return `Nothing right now. Next: ${state.next.title} at ${state.next.start_time}. Tap to open FocusFlow.`;
  }
}

// FR-002/FR-005/FR-006/FR-007: every WidgetState.kind renders something explicit —
// there is no case that falls through to a blank widget.
export function NowNextWidget({ state }: { state: WidgetState }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={widgetAccessibilityLabel(state)}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: color.text as HexColor,
        borderRadius: 16,
        padding: 12,
      }}
    >
      {state.kind === 'signed_out' && <Line text="Sign in to see your schedule" color="#aaaaaa" />}
      {state.kind === 'empty' && <Line text="Nothing scheduled today" color="#aaaaaa" />}
      {state.kind === 'nothing_left' && <Line text="Nothing scheduled right now" color="#aaaaaa" />}
      {(state.kind === 'current_and_next' || state.kind === 'current_only') && (
        <Line text={`Now: ${state.current.title}`} color={color.primary as HexColor} bold />
      )}
      {state.kind === 'next_only' && <Line text="Nothing right now" color="#aaaaaa" />}
      {(state.kind === 'current_and_next' || state.kind === 'next_only') && (
        <Line text={`Next: ${state.next.title} (${state.next.start_time})`} color="#dddddd" />
      )}
      {state.kind === 'current_only' && <Line text="Nothing else today" color="#999999" />}
    </FlexWidget>
  );
}
