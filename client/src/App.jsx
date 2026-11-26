import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { missingEnv } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Placeholder from './pages/Placeholder'
import ResetPassword from './pages/ResetPassword'

function Protected({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center">Carregando…</div>
  return session ? children : <Navigate to="/entrar" replace />
}

// Tela mostrada quando faltam variáveis de ambiente no build (em vez de tela branca)
function ConfigError({ missing }) {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900">
        <h1 className="text-xl font-bold mb-2">Configuração incompleta</h1>
        <p className="mb-3">
          O app foi gerado sem as variáveis de ambiente abaixo, por isso não consegue conectar ao servidor:
        </p>
        <ul className="list-disc pl-5 mb-3 font-mono text-sm">
          {missing.map((name) => <li key={name}>{name}</li>)}
        </ul>
        <p className="text-sm">
          Cadastre esses valores como <b>Secrets</b> do repositório no GitHub
          (Settings → Secrets and variables → Actions) ou no arquivo <code>client/.env</code>
          e gere o APK novamente.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { session, recovery } = useAuth()

  if (missingEnv.length) return <ConfigError missing={missingEnv} />

  if (recovery && session) return <ResetPassword />
  return (
    <Routes>
      <Route path="/entrar" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Placeholder title="Feed" stage={2} hint="Posts, fotos, curtidas e comentários." />} />
        <Route path="amigos" element={<Placeholder title="Amigos" stage={2} hint="Diretório, pedidos de amizade e bloqueio." />} />
        <Route path="conversas" element={<Placeholder title="Conversas" stage={3} hint="Chat normal e Modo Efêmero." />} />
        <Route path="perfil" element={<Placeholder title="Meu perfil" stage={2} hint="Capa, bio, status, depoimentos e visitantes." />} />
        <Route path="perfil/:id" element={<Placeholder title="Perfil" stage={2} hint="Perfil de outro usuário." />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
