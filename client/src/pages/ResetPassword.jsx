import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    const { error } = await updatePassword(pw)
    if (error) setMsg(error.message)
  }
  return (
    <div className="min-h-screen grid place-items-center bg-tinta p-6 text-white">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h2 className="text-2xl font-extrabold">Crie uma nova senha</h2>
        <input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="Nova senha (mín. 6 caracteres)"
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-rosa" />
        <button className="w-full rounded-xl bg-rosa py-3 font-semibold">Salvar senha</button>
        {msg && <p role="alert" className="text-sm text-white/80">{msg}</p>}
      </form>
    </div>
  )
}
