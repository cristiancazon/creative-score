import { createDirectus, rest, realtime, authentication } from '@directus/sdk';
import { Schema } from '@/types/directus';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

console.log(`[Directus Config] Initializing. Env: ${typeof window !== 'undefined' ? 'Client' : 'Server'}`);

// Custom storage adaptor to ensure we use localStorage in the browser correctly
// The SDK seems to pass the entire token object as the first argument to 'set' in some configurations.
const AUTH_STORAGE_KEY = 'creative_score_cms_token';

const storage = typeof window !== 'undefined' ? {
  get: () => {
    const val = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return val ? JSON.parse(val) : null;
  },
  set: (data: any) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  },
  delete: () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
} : undefined;

export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(authentication('json', {
    storage: storage as any,
    autoRefresh: true
  }))
  .with(rest())
  .with(realtime());
