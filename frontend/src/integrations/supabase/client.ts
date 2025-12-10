// Lightweight stub for Supabase client so frontend can build without the
// `@supabase/supabase-js` dependency. If you do use Supabase in the app,
// install the official client and restore the original implementation.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function noopAsync(result: any = null) {
  return Promise.resolve({ data: result, error: null });
}

export const supabase = {
  from: (_table: string) => ({
    select: (_cols?: string) => noopAsync([]),
    insert: (_rows: any) => noopAsync({}),
    update: (_rows: any) => noopAsync({}),
    delete: () => noopAsync({}),
  }),
  auth: {
    getUser: () => noopAsync({ user: null }),
    // no-op signIn/signOut placeholders
    signIn: () => noopAsync({}),
    signOut: () => noopAsync({}),
  },
  functions: {
    invoke: (_name: string, _opts?: any) => noopAsync(null),
  },
  // expose URLs for debugging
  __meta: {
    url: SUPABASE_URL,
    key: SUPABASE_PUBLISHABLE_KEY,
  },
};