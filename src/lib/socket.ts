// src/lib/socket.ts — Socket.io Server for NEXUS Real-time Events
// Uses globalThis to share the Socket.io instance between server.ts and API routes

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

/**
 * Get the Socket.io instance from the global scope.
 * The custom server (server.ts) stores it at globalThis.__nexus_io.
 */
function getIO(): SocketIOServer | null {
  return (globalThis as any).__nexus_io ?? null
}

/**
 * Initialize Socket.io server attached to an HTTP server.
 * Called once from the custom server (server.ts).
 */
export function initSocket(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    socket.on('join:staff', (staffId: string) => {
      socket.join(`staff:${staffId}`)
      console.log(`[Socket.io] ${socket.id} joined staff room: ${staffId}`)
    })

    socket.on('join:dashboard', () => {
      socket.join('dashboard')
      console.log(`[Socket.io] ${socket.id} joined dashboard room`)
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`)
    })
  })

  // Store in global scope so API routes can access it
  ;(globalThis as any).__nexus_io = io
  console.log('[Socket.io] Server initialized and stored globally')
  return io
}

/**
 * Emit an event to ALL connected clients (dashboard + all staff).
 */
export function emitToAll(event: string, data: unknown): void {
  const io = getIO()
  if (io) {
    io.emit(event, data)
  } else {
    console.warn(`[Socket.io] Cannot emit "${event}" — server not initialized`)
  }
}

/**
 * Emit an event to a specific staff member's device.
 */
export function emitToStaff(staffId: string, event: string, data: unknown): void {
  const io = getIO()
  if (io) {
    io.to(`staff:${staffId}`).emit(event, data)
  }
}

/**
 * Emit an event to the command dashboard only.
 */
export function emitToDashboard(event: string, data: unknown): void {
  const io = getIO()
  if (io) {
    io.to('dashboard').emit(event, data)
  }
}
