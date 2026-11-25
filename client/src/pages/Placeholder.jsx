import { useAuth } from '../context/AuthContext'

// Telas que serão implementadas nas próximas etapas.
export default function Placeholder({ title, stage, hint }) {
  const { profile } = useAuth()
  return (
    <section className="rounded-2xl bg-white p-8">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="mt-2 text-tinta/70">{hint}</p>
      <p className="mt-4 text-sm font-semibold text-azul">Chega na etapa {stage}.</p>
      {title === 'Feed' && profile && <p className="mt-6">Olá, {profile.display_name}.</p>}
    </section>
  )
}
