import { type WidgetTaskHandlerProps } from 'react-native-android-widget';
import { buildWidgetState } from '@/features/widget/buildWidgetState';
import { NowNextWidget } from '@/features/widget/NowNextWidget';

// research.md §2/§3: no new backend, no new now/next logic — reads the same
// `activities` table and reuses 003-timeline-visualization's getNowAndNext.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const state = await buildWidgetState('widget_refresh');
      props.renderWidget(<NowNextWidget state={state} />);
      break;
    }
    default:
      break;
  }
}
