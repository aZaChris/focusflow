// registerWidgetTaskHandler must run at the top-level entry, the same place
// AppRegistry/registerRootComponent is called — it can't be done from inside a
// React component, since it must also run in a headless context (no UI) when
// Android invokes the widget outside the app being open (research.md §... see
// specs/006-now-next-widget/plan.md). This file reproduces what
// expo-router/entry does internally (expo-router/entry-classic.js) so the
// widget registration can sit alongside it — if expo-router's internal entry
// structure changes on a future upgrade, this file needs revisiting too.
import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/features/widget/widgetTaskHandler';
// Defines the headless background task (007-lockscreen-timeline) as a side
// effect of this import — same reason it has to sit here and not in a
// component, see that file's own comment.
import './src/features/lockscreen/backgroundTask';

renderRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);
