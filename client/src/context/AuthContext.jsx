import { createContext, useContext, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from '../lib/supabase'
import { connectSocket, disconnectSocket } from '../lib/socket'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const native = Capacitor.isNativePlatform()
const REDIRECT = native ? 'com.quintal.app://login-callback' : window.location.origin

// Celular em formato internacional; assume Brasil (+55) se faltar o código do país
export const toE164 = (v) => {
  const d = v.replace(/\D/g, '')
  return v.trim().startsWith('+') ? `+${d}` : `+55${d}`
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false) // true = precisa definir nova senha

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s)
      if (evt === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Android: o Google e o link de recuperação voltam como com.quintal.app://login-callback?code=...
  useEffect(() => {
    if (!native) return
    const h = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('com.quintal.app://')) return
      Browser.close().catch(() => {})
      const code = new URL(url).searchParams.get('code')
      if (code) await supabase.auth.exchangeCodeForSession(code)
    })
    return () => { h.then((x) => x.remove()) }
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); disconnectSocket(); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
    connectSocket(session.access_token)
  }, [session?.user?.id])

  const auth = supabase.auth
  const api = {
    // Google
    signInWithGoogle: async () => {
      const { data, error } = await auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: REDIRECT, skipBrowserRedirect: native },
      })
      if (!error && native) await Browser.open({ url: data.url })
      return { error }
    },
    // E-mail + senha
    signUpEmail: (email, password, name) =>
      auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: REDIRECT } }),
    signInEmail: (email, password) => auth.signInWithPassword({ email, password }),
    resetEmail: (email) => auth.resetPasswordForEmail(email, { redirectTo: REDIRECT }),
    // Celular + SMS
    signUpPhone: (phone, password, name) =>
      auth.signUp({ phone: toE164(phone), password, options: { data: { full_name: name } } }),
    signInPhone: (phone, password) => auth.signInWithPassword({ phone: toE164(phone), password }),
    sendPhoneCode: (phone) => auth.signInWithOtp({ phone: toE164(phone) }), // login ou recuperação
    verifyPhone: async (phone, token, { recover = false } = {}) => {
      const res = await auth.verifyOtp({ phone: toE164(phone), token, type: 'sms' })
      if (!res.error && recover) setRecovery(true) // código SMS validado → pede nova senha
      return res
    },
    // Nova senha (após link do e-mail ou código SMS)
    updatePassword: async (password) => {
      const res = await auth.updateUser({ password })
      if (!res.error) setRecovery(false)
      return res
    },
    signOut: () => auth.signOut(),
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, recovery, ...api }}>
      {children}
    </AuthContext.Provider>
  )
}
