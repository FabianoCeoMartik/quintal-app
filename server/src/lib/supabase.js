import { createClient } from '@supabase/supabase-js'

// Só valida tokens de login. O servidor NÃO grava nada do Modo Efêmero.
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export async function userFromToken(token) {
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  return error ? null : data.user
}
