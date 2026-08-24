// App.tsx
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Import SafeAreaProvider
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    // react-native-gesture-handler requires the root view to be wrapped in
    // GestureHandlerRootView, or gestures (including the stack navigator's
    // swipe-back) silently fail, especially on Android.
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Wrap the entire app in SafeAreaProvider */}
      <SafeAreaProvider>
        <AppNavigator />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}