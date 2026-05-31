// App.tsx
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Import SafeAreaProvider

export default function App() {
  return (
    // Wrap the entire app in SafeAreaProvider
    <SafeAreaProvider>
      <AppNavigator />
      <Toast />
    </SafeAreaProvider>
  );
}