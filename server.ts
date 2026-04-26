// server.ts — Custom Node.js Server for NEXUS
// Wraps Next.js with Socket.io for real-time WebSocket communication
// Run with: npx tsx server.ts

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initSocket } from './src/lib/socket'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Initialize Socket.io on the same HTTP server
  const io = initSocket(server)

  // Make io globally accessible for API routes
  ;(globalThis as any).__nexus_io = io

  server.listen(port, () => {
    console.log('')
    console.log('  ╔══════════════════════════════════════════╗')
    console.log('  ║                                          ║')
    console.log('  ║   🏨  NEXUS — Crisis Command Intelligence  ║')
    console.log('  ║                                          ║')
    console.log(`  ║   ➤  Dashboard:  http://${hostname}:${port}/dashboard  ║`)
    console.log(`  ║   ➤  Simulator:  http://${hostname}:${port}/simulate   ║`)
    console.log(`  ║   ➤  Staff:      http://${hostname}:${port}/staff/     ║`)
    console.log('  ║                                          ║')
    console.log(`  ║   Socket.io:  ✓ Ready                    ║`)
    console.log(`  ║   Mode:       ${dev ? 'Development' : 'Production'}                ║`)
    console.log('  ║                                          ║')
    console.log('  ╚══════════════════════════════════════════╝')
    console.log('')
  })
})
