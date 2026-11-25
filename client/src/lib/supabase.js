import { createClient } from '@supabase/supabase-js'

// PKCE: necessário para voltar do Google / e-mail de recuperação dentro do app Android
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { flowType: 'pkce' } }
)
