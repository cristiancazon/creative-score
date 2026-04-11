import { createDirectus, rest, realtime, authentication } from '@directus/sdk';
import { Schema } from '@/types/directus';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';



// Custom storage adaptor to ensure we use localStorage in the browser correctly
// The SDK seems to pass the entire token object as the first argument to 'set' in some configurations.
const AUTH_STORAGE_KEY = 'creative_score_cms_token';

const storage = typeof window !== 'undefined' ? {
  get: () => {
    try {
      const val = window.localStorage.getItem(AUTH_STORAGE_KEY);

      // If it's literally the string "undefined", return null
      if (val === 'undefined' || val === null) return null;
      return JSON.parse(val);
    } catch (e) {
      console.error("[Directus Storage] Parse error:", e);
      return null;
    }
  },
  set: (data: any) => {
    // In 'json' mode, the SDK passes the entire session object as the first argument

    if (data === undefined) {
      console.warn("[Directus Storage] Attempted to set undefined data based on single arg check");
      return;
    }
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

export function getFileUrl(fileId: string) {
  if (!fileId) return '';
  return `${DIRECTUS_URL}/assets/${fileId}`;
}
