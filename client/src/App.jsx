import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Placeholder from './pages/Placeholder'
import ResetPassword from './pages/ResetPassword'

function Protected({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center">Carregando…</div>
  return session ? children : <Navigate to="/entrar" replace />
}

export default function App() {
  const { session, recovery } = useAuth()
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
