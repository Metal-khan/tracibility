// src/services/api.ts
import axios from 'axios';

// --- UPDATED IP ADDRESS ---
// The IP is now 192.168.1.6
const API_BASE_URL = 'http://192.168.1.8:8000/api';
// --- END UPDATED ---

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;