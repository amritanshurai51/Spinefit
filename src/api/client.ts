import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'authToken';
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.yourcompany.com/v1',
  timeout: 15000,
});
api.interceptors.request.use(async cfg => {
  const t = await SecureStore.getItemAsync(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
