import { io } from 'socket.io-client'

let socket = null

// Conecta usando o JWT atual do Supabase; reutiliza a conexão existente.
export function connectSocket(token) {
  if (socket) return socket
  socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token }, autoConnect: true })
  return socket
}
export function getSocket() { return socket }
export function disconnectSocket() { socket?.disconnect(); socket = null }
