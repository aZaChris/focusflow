import { requireNativeModule } from 'expo-modules-core';

export interface FocusWidgetModule {
  updateWidget(activitiesJson: string): Promise<void>;
  requestPinAppWidget(): Promise<void>;
}

let FocusWidgetModuleInstance: FocusWidgetModule | null = null;
try {
  FocusWidgetModuleInstance = requireNativeModule('FocusWidget');
} catch (e) {
  console.warn("Native module 'FocusWidget' not found. Widget features will be disabled.");
}

export default FocusWidgetModuleInstance;
