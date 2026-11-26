import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Considera "faltando" se estiver vazia ou ainda com o valor de exemplo do .env.example
const isSet = (v) =>
  typeof v === 'string' && v.trim() !== '' && !v.includes('SEU-PROJETO') && !v.includes('SUA_ANON_KEY')

// Nomes das variáveis que faltam (o App mostra isso na tela em vez de quebrar)
export const missingEnv = [
  ['VITE_SUPABASE_URL', url],
  ['VITE_SUPABASE_ANON_KEY', key],
].filter(([, v]) => !isSet(v)).map(([name]) => name)

if (missingEnv.length) {
  console.error('[Quintal] Variáveis de ambiente ausentes:', missingEnv.join(', '))
}

// createClient lança erro se a URL/chave forem vazias (=> tela branca).
// Com variáveis ausentes usamos valores fictícios só para o app conseguir abrir
// e exibir a mensagem de configuração.
// PKCE: necessário para voltar do Google / e-mail de recuperação dentro do app Android
export const supabase = createClient(
  missingEnv.length ? 'https://placeholder.supabase.co' : url.trim(),
  missingEnv.length ? 'placeholder-anon-key' : key.trim(),
  { auth: { flowType: 'pkce' } }
)
