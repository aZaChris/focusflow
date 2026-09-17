import { type WidgetTaskHandlerProps } from 'react-native-android-widget';
import { buildNowNextState } from '@/features/shared/nowNextState';
import { NowNextWidget } from '@/features/widget/NowNextWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const state = await buildNowNextState();
      props.renderWidget(<NowNextWidget state={state} />);
      break;
    }
    default:
      break;
  }
}
