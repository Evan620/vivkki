import { supabase } from '../database';

export interface ApiKeyRow {
  id: number;
  name: string;
  rate_limit_per_hour: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

const API_KEY_LENGTH = 64;

function randomKey(length = API_KEY_LENGTH): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new API key for the current user.
 * Returns the plain key once; the hash is stored in the database.
 */
export async function createApiKey(
  name: string,
  rateLimitPerHour = 100,
  expiresAt?: string | null
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  // Require an authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { success: false, error: 'Not authenticated' };
  }
  const userId = userData.user.id;

  const apiKey = randomKey();
  const keyHash = await hashApiKey(apiKey);

  const { error: insertError } = await supabase.from('api_keys').insert({
    key_hash: keyHash,
    name,
    rate_limit_per_hour: rateLimitPerHour,
    is_active: true,
    expires_at: expiresAt || null,
    user_id: userId,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, apiKey };
}

/**
 * List API keys for the current user.
 * Returns metadata only (hash is never returned).
 */
export async function listApiKeys(): Promise<{
  success: boolean;
  keys?: ApiKeyRow[];
  error?: string;
}> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, rate_limit_per_hour, is_active, created_at, last_used_at, expires_at')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, keys: data || [] };
}

export async function setApiKeyActive(
  keyId: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('api_keys').update({ is_active: isActive }).eq('id', keyId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateApiKeyRateLimit(
  keyId: number,
  rateLimitPerHour: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('api_keys')
    .update({ rate_limit_per_hour: rateLimitPerHour })
    .eq('id', keyId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteApiKey(keyId: number): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('api_keys').delete().eq('id', keyId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
 