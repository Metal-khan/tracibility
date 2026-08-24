// src/services/api.ts
import axios from 'axios';
import { Platform } from 'react-native';

// The backend URL is read from EXPO_PUBLIC_API_URL (set it in a .env file —
// see .env.example) so it isn't hardcoded to one developer's network.
//
// - iOS Simulator / Android Emulator running on this same machine: the
//   fallback below (localhost / 10.0.2.2) works out of the box.
// - A physical phone via Expo Go: it must be on the same Wi-Fi network as
//   the machine running `php artisan serve`, and EXPO_PUBLIC_API_URL must
//   point at that machine's LAN IP, e.g. http://192.168.1.23:8000/api.
const defaultLocalUrl = Platform.select({
  android: 'http://10.0.2.2:8000/api', // Android emulator's alias for the host machine
  default: 'http://localhost:8000/api', // iOS Simulator / web
});

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || defaultLocalUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;