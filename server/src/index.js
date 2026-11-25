import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { userFromToken } from './lib/supabase.js'

const app = express()
const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,https://localhost').split(',')
app.use(cors({ origin }))
app.get('/health', (_req, res) => res.json({ ok: true }))

const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin } })

// Presença em memória: userId -> Set de socket ids (vários dispositivos)
const online = new Map()

// Autenticação do socket com o JWT do Supabase
io.use(async (socket, next) => {
  const user = await userFromToken(socket.handshake.auth?.token)
  if (!user) return next(new Error('unauthorized'))
  socket.data.userId = user.id
  next()
})

io.on('connection', (socket) => {
  const uid = socket.data.userId
  socket.join(`user:${uid}`) // sala pessoal: entrega direcionada

  if (!online.has(uid)) online.set(uid, new Set())
  online.get(uid).add(socket.id)
  io.emit('presence:update', { userId: uid, online: true })

  // Cliente pergunta quem está online dentre uma lista de ids
  socket.on('presence:query', (ids, ack) => {
    if (typeof ack !== 'function' || !Array.isArray(ids)) return
    ack(ids.filter((id) => online.has(id)))
  })

  // Etapa 3: chat normal (persistido no Supabase, ticks de entrega/leitura)
  // Etapa 4: namespace/eventos efêmeros apenas em RAM

  socket.on('disconnect', () => {
    const set = online.get(uid)
    set?.delete(socket.id)
    if (!set?.size) {
      online.delete(uid)
      io.emit('presence:update', { userId: uid, online: false })
    }
  })
})

const port = process.env.PORT || 3001
httpServer.listen(port, () => console.log(`Quintal server em http://localhost:${port}`))
