import { useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const input = 'w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-rosa'
const btn = 'w-full rounded-xl bg-rosa py-3 font-semibold text-white disabled:opacity-50'

export default function Login() {
  const a = useAuth()
  const [via, setVia] = useState('email')      // email | phone
  const [action, setAction] = useState('login') // login | signup | forgot
  const [codeSent, setCodeSent] = useState(false)
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', code: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const run = async (fn, okMsg) => {
    setBusy(true); setMsg('')
    const { error } = (await fn()) || {}
    setBusy(false)
    if (error) return setMsg(error.message)
    if (okMsg) setMsg(okMsg)
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    if (via === 'email') {
      if (action === 'login') return run(() => a.signInEmail(f.email, f.password))
      if (action === 'signup') return run(() => a.signUpEmail(f.email, f.password, f.name), 'Enviamos um link de confirmação para o seu e-mail.')
      return run(() => a.resetEmail(f.email), 'Se o e-mail existir, enviamos o link para criar uma nova senha.')
    }
    // Celular
    if (action === 'login') return run(() => a.signInPhone(f.phone, f.password))
    if (!codeSent) {
      const send = action === 'signup' ? () => a.signUpPhone(f.phone, f.password, f.name) : () => a.sendPhoneCode(f.phone)
      if (await run(send, 'Enviamos um código por SMS.')) setCodeSent(true)
      return
    }
    return run(() => a.verifyPhone(f.phone, f.code, { recover: action === 'forgot' }))
  }

  const go = (x) => { setAction(x); setCodeSent(false); setMsg('') }
  const title = { login: 'Entrar', signup: 'Criar conta', forgot: 'Recuperar senha' }[action]
  const needsPassword = action !== 'forgot'

  return (
    <div className="min-h-screen grid place-items-center bg-tinta p-6 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-5xl font-extrabold leading-none">Quintal<span className="text-rosa">.</span></h1>
        <h2 className="mt-6 text-xl font-semibold">{title}</h2>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[['email', Mail, 'E-mail'], ['phone', Phone, 'Celular']].map(([k, Icon, l]) => (
            <button key={k} type="button" onClick={() => { setVia(k); setCodeSent(false); setMsg('') }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 ${via === k ? 'bg-white text-tinta' : 'bg-white/10'}`}>
              <Icon size={18} /> {l}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {action === 'signup' && <input className={input} placeholder="Seu nome" value={f.name} onChange={set('name')} required />}
          {via === 'email'
            ? <input className={input} type="email" placeholder="E-mail" value={f.email} onChange={set('email')} required />
            : <input className={input} type="tel" placeholder="Celular com DDD (ex.: 18 99999-0000)" value={f.phone} onChange={set('phone')} required disabled={codeSent} />}
          {needsPassword && !(codeSent) &&
            <input className={input} type="password" placeholder="Senha (mín. 6 caracteres)" minLength={6} value={f.password} onChange={set('password')} required />}
          {codeSent && <input className={input} inputMode="numeric" placeholder="Código do SMS" value={f.code} onChange={set('code')} required />}
          <button className={btn} disabled={busy}>
            {codeSent ? 'Confirmar código' : action === 'forgot' ? (via === 'phone' ? 'Enviar código por SMS' : 'Enviar link') : title}
          </button>
        </form>

        {msg && <p role="status" className="mt-3 text-sm text-white/80">{msg}</p>}

        <div className="mt-4 flex justify-between text-sm text-white/70">
          {action === 'login' ? (<>
            <button onClick={() => go('forgot')}>Esqueci a senha</button>
            <button onClick={() => go('signup')}>Criar conta</button></>
          ) : <button onClick={() => go('login')}>Voltar para entrar</button>}
        </div>

        <div className="my-6 flex items-center gap-3 text-sm text-white/50"><hr className="flex-1 border-white/20" />ou<hr className="flex-1 border-white/20" /></div>
        <button onClick={a.signInWithGoogle} className="w-full rounded-xl bg-white py-3 font-semibold text-tinta">Continuar com Google</button>
      </div>
    </div>
  )
}
