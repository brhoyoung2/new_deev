import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { required } from './env'

let cached: SupabaseClient | null = null

/**
 * service_role 클라이언트.
 *
 * **서버에서만 부른다.** 이 키가 브라우저로 나가면 RLS 가 무의미해진다.
 */
export function db(): SupabaseClient {
  if (cached) return cached
  cached = createClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
  return cached
}
