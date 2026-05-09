import axios from 'axios';
import mockData from './mockData';

const api = axios.create({
  baseURL: '/api',
  timeout: 3000, // short timeout so mock fallback is fast
});

/**
 * Try the real API; if unreachable, fall back to static mock data.
 * This lets the frontend run standalone with `npm run dev` — no backend needed.
 */
async function withFallback(endpoint, mockKey, paramTransform) {
  try {
    const { data } = await api.get(endpoint);
    if (data?.data) return data.data;
  } catch {
    console.warn(`[API] ${endpoint} unreachable, using mock data.`);
  }
  const result = mockData[mockKey];
  return typeof paramTransform === 'function' ? paramTransform(result) : result;
}

export function fetchOverview() {
  return withFallback('/overview', 'overview');
}

export function fetchEda() {
  return withFallback('/eda', 'eda');
}

export function fetchModels() {
  return withFallback('/models', 'models');
}

export function fetchFeatures() {
  return withFallback('/features', 'features');
}

export function fetchErrors(model = 'mlp_rf') {
  return withFallback('/errors', 'errors');
}
