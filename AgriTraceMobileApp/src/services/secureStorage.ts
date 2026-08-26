// src/services/secureStorage.ts
//
// Drop-in replacement for AsyncStorage with the same three-method shape
// (getItem/setItem/removeItem), so every screen that already does
// `AsyncStorage.getItem('userToken')` etc. keeps working unchanged — only
// the import line needs to change. Sensitive keys (currently just the auth
// token) are routed to expo-secure-store (Keychain on iOS, Keystore-backed
// encrypted storage on Android) instead of AsyncStorage's plain,
// unencrypted on-device storage. Everything else (userRole, and any other
// non-sensitive preference) passes through to AsyncStorage as before.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SECURE_KEYS = new Set(['userToken']);

async function getItem(key: string): Promise<string | null> {
  if (SECURE_KEYS.has(key)) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (SECURE_KEYS.has(key)) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (SECURE_KEYS.has(key)) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export default { getItem, setItem, removeItem };
