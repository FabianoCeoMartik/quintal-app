import { NavLink, Outlet } from 'react-router-dom'
import { Home, Users, MessageCircle, UserCircle, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const items = [
  { to: '/', label: 'Feed', icon: Home },
  { to: '/amigos', label: 'Amigos', icon: Users },
  { to: '/conversas', label: 'Conversas', icon: MessageCircle },
  { to: '/perfil', label: 'Meu perfil', icon: UserCircle },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors ${
      isActive ? 'bg-tinta text-white' : 'text-tinta hover:bg-white'}`

  return (
    <div className="min-h-screen md:flex">
      {/* Navegação lateral (desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:justify-between md:sticky md:top-0 md:h-screen p-4 border-r border-tinta/10">
        <div>
          <h1 className="text-3xl font-extrabold px-4 py-3">Quintal<span className="text-rosa">.</span></h1>
          <nav className="mt-4 space-y-1">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={link}>
                <Icon size={20} /> {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 text-tinta/70 hover:text-tinta">
          <LogOut size={20} /> Sair {profile && <span className="truncate text-sm">({profile.display_name})</span>}
        </button>
      </aside>

      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        <div className="mx-auto max-w-2xl p-4"><Outlet /></div>
      </main>

      {/* Navegação inferior (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-tinta/10 grid grid-cols-4 pb-safe">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} aria-label={label}
            className={({ isActive }) => `flex flex-col items-center gap-1 py-3 text-xs font-semibold ${isActive ? 'text-azul' : 'text-tinta/60'}`}>
            <Icon size={22} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
