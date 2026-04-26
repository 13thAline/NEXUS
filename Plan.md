# NEXUS — Hospitality Crisis Command Intelligence
## Hackathon Build Prompt & Implementation Guide

**Format:** Hackathon (24–48 hours)  
**Team:** 4 working professionals  
**Frontend:** Next.js 14 (App Router)  
**Core Principle:** Zero paid APIs. Zero cloud dependency. All local.  
**Problem solved:** Hotels already detect anomalies. Nobody knows what to do next.

---

## THE CORE PROBLEM (READ THIS FIRST)

A fire alarm goes off in a 200-room hotel at 11 PM.

The sensor detected it. The alert fired. Now what?

- The front desk manager is trying to reach security on a crackling radio.
- Security is calling the duty manager's mobile, which is going to voicemail.
- Housekeeping on floor 4 has no idea what's happening.
- A guest in room 402 is mobility-impaired and nobody has been assigned to assist them.
- The fire service arrives and the first thing they ask is: "How many guests are inside?" Nobody has an accurate answer.
- Seventeen minutes later, after everyone has figured out their roles through sheer panic and improvisation, the evacuation is complete.

**The hardware worked perfectly. The software brain didn't exist.**

NEXUS is that brain. It already assumes the hotel has:
- A Property Management System (PMS) with occupancy data
- Existing anomaly detection (fire panels, security cameras, CCTV software)
- A staff roster with roles, locations, and contact info

NEXUS plugs into these existing systems via a lightweight integration layer and answers the one question nobody can answer under pressure:

**"Who should do exactly what, right now, in what order — and how do we tell them?"**

---

## WHAT NEXUS ACTUALLY BUILDS

A local-first, real-time crisis coordination platform with four components:

1. **Incident Ingestor** — receives anomaly events from existing hotel systems (webhook/poll) and classifies them
2. **Task Assignment Engine** — a local LLM-powered orchestrator that maps incidents to staff tasks based on roles, locations, and capabilities
3. **Command Dashboard** — Next.js real-time UI for the duty manager showing incident state, assigned tasks, staff acknowledgements, and guest accountability
4. **Staff Notification Interface** — a mobile-first Next.js page that staff access on their phones to see their assigned task, acknowledge it, and mark it complete

Everything runs on a single laptop or a hotel's on-premise server. No Anthropic API. No paid services. No internet required.

---

## TECHNOLOGY STACK

### Backend
| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 20 + TypeScript | Fast to build, easy to share across team |
| Framework | Next.js 14 API Routes | Same codebase as frontend |
| Local LLM | Ollama + Llama 3.1 8B | Runs on any modern laptop, completely offline |
| LLM Client | `ollama` npm package | Simple streaming API |
| Real-time | Socket.io | WebSocket pub/sub for live dashboard updates |
| Database | SQLite via Prisma | Zero-config, file-based, no server to spin up |
| Schema | Zod | Runtime validation for all LLM outputs |

### Frontend
| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server components + live routes in one codebase |
| Styling | Tailwind CSS | Fast to build a clean, professional UI |
| Real-time | Socket.io client | Connects to backend for live incident updates |
| State | Zustand | Lightweight, no ceremony |
| UI Components | shadcn/ui | Pre-built accessible components |

### Simulated Integrations (Mocked — no real API keys needed)
| System | How we mock it | What it provides |
|---|---|---|
| PMS (Opera/FIDELIO) | A JSON seed file + `/api/pms/occupancy` endpoint | Room-by-room occupancy, guest mobility flags |
| Fire Panel | A POST endpoint that accepts alarm zone + severity | Incident trigger |
| Staff Roster | A JSON seed file + `/api/staff/roster` endpoint | Staff ID, role, current floor, contact (phone/radio) |
| Security Camera System | Webhook endpoint that accepts zone + anomaly type | CCTV anomaly triggers |

**All of these are designed to be replaced with real integrations later. For the hackathon, they are simple JSON files and REST endpoints.**

---

## PROJECT STRUCTURE

```
nexus/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Mock hotel data (rooms, staff, occupancy)
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Login / role selector
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Duty manager command dashboard
│   │   ├── staff/
│   │   │   └── [staffId]/
│   │   │       └── page.tsx   # Mobile-first staff task view
│   │   └── api/
│   │       ├── incident/
│   │       │   ├── trigger/route.ts     # POST — receives anomaly events
│   │       │   └── [id]/route.ts        # GET — current incident state
│   │       ├── pms/
│   │       │   └── occupancy/route.ts   # GET — mocked PMS occupancy data
│   │       ├── staff/
│   │       │   └── roster/route.ts      # GET — mocked staff roster
│   │       └── tasks/
│   │           ├── route.ts             # GET all tasks for incident
│   │           └── [taskId]/
│   │               └── acknowledge/route.ts  # POST — staff ack/complete
│   │
│   ├── lib/
│   │   ├── ollama.ts          # Ollama LLM client + prompt templates
│   │   ├── task-engine.ts     # Core task assignment orchestrator
│   │   ├── incident-state.ts  # Incident state machine
│   │   ├── socket.ts          # Socket.io server setup
│   │   └── validators.ts      # Zod schemas for LLM output + API
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── IncidentHeader.tsx   # Incident type, severity, timer
│   │   │   ├── TaskBoard.tsx        # Kanban: unassigned/assigned/done
│   │   │   ├── StaffMap.tsx         # Floor grid showing staff positions
│   │   │   ├── GuestRoll.tsx        # Guest accountability tracker
│   │   │   └── LiveFeed.tsx         # Real-time event log
│   │   └── staff/
│   │       ├── TaskCard.tsx         # Staff sees their assigned task
│   │       └── AckButton.tsx        # Acknowledge and complete controls
│   │
│   └── types/
│       └── index.ts           # Shared TypeScript types
│
├── data/
│   ├── hotel.json             # Hotel floor plan (zones, stairwells, exits)
│   ├── staff.json             # Mocked staff roster
│   └── occupancy.json         # Mocked PMS occupancy snapshot
│
├── .env.local
├── package.json
└── README.md
```

---

## DATABASE SCHEMA (Prisma / SQLite)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./nexus.db"
}

model Incident {
  id          String    @id @default(cuid())
  type        String    // FIRE | ACTIVE_SHOOTER | MEDICAL | GAS_LEAK | STRUCTURAL | EVACUATION
  severity    String    // LOW | MEDIUM | HIGH | CRITICAL
  zone        String    // e.g. "Floor 3 - Room 304 corridor"
  floor       Int
  status      String    @default("ACTIVE")  // ACTIVE | CONTAINED | RESOLVED
  triggeredAt DateTime  @default(now())
  resolvedAt  DateTime?
  rawPayload  String    // Original JSON from sensor/source system
  tasks       Task[]
  events      IncidentLog[]
}

model Task {
  id           String    @id @default(cuid())
  incidentId   String
  incident     Incident  @relation(fields: [incidentId], references: [id])
  staffId      String
  staffName    String
  staffRole    String
  description  String    // Plain English: what this person needs to do
  priority     Int       // 1 = highest priority
  floor        Int       // Where this task takes place
  zone         String
  status       String    @default("PENDING")  // PENDING | ACKNOWLEDGED | IN_PROGRESS | DONE
  assignedAt   DateTime  @default(now())
  acknowledgedAt DateTime?
  completedAt  DateTime?
  llmReasoning String?   // Why the LLM assigned this task to this person
}

model IncidentLog {
  id         String   @id @default(cuid())
  incidentId String
  incident   Incident @relation(fields: [incidentId], references: [id])
  message    String
  source     String   // SYSTEM | STAFF | LLM | SENSOR
  createdAt  DateTime @default(now())
}
```

---

## MOCK DATA SEED

```typescript
// data/staff.json
[
  {
    "id": "staff_001",
    "name": "Ravi Sharma",
    "role": "SECURITY",
    "subRole": "Security Officer",
    "floor": 1,
    "zone": "Main Lobby",
    "contact": "+91-98765-00001",
    "certifications": ["CPR", "FIRE_WARDEN"],
    "available": true
  },
  {
    "id": "staff_002",
    "name": "Priya Nair",
    "role": "HOUSEKEEPING",
    "subRole": "Floor Supervisor",
    "floor": 3,
    "zone": "Floor 3 Corridor",
    "contact": "+91-98765-00002",
    "certifications": ["FIRE_WARDEN"],
    "available": true
  },
  {
    "id": "staff_003",
    "name": "Arjun Mehta",
    "role": "ENGINEERING",
    "subRole": "Duty Engineer",
    "floor": "B1",
    "zone": "Engineering Room",
    "contact": "+91-98765-00003",
    "certifications": ["ELECTRICAL", "HVAC"],
    "available": true
  },
  {
    "id": "staff_004",
    "name": "Sunita Rao",
    "role": "FRONT_DESK",
    "subRole": "Duty Manager",
    "floor": 1,
    "zone": "Reception",
    "contact": "+91-98765-00004",
    "certifications": ["FIRST_AID"],
    "available": true
  },
  {
    "id": "staff_005",
    "name": "Deepak Verma",
    "role": "SECURITY",
    "subRole": "Senior Security",
    "floor": 2,
    "zone": "Floor 2 Patrol",
    "contact": "+91-98765-00005",
    "certifications": ["CPR", "FIRE_WARDEN", "CROWD_CONTROL"],
    "available": true
  },
  {
    "id": "staff_006",
    "name": "Kavitha Iyer",
    "role": "HOUSEKEEPING",
    "subRole": "Floor Staff",
    "floor": 4,
    "zone": "Floor 4 Rooms",
    "contact": "+91-98765-00006",
    "certifications": [],
    "available": true
  }
]
```

```typescript
// data/occupancy.json
{
  "timestamp": "2026-04-24T14:30:00Z",
  "totalRooms": 120,
  "occupiedRooms": 87,
  "guests": [
    { "room": "101", "floor": 1, "guestCount": 2, "mobilityImpaired": false, "checkoutDate": "2026-04-25" },
    { "room": "201", "floor": 2, "guestCount": 1, "mobilityImpaired": false, "checkoutDate": "2026-04-26" },
    { "room": "204", "floor": 2, "guestCount": 2, "mobilityImpaired": true, "assistanceNote": "Wheelchair user", "checkoutDate": "2026-04-25" },
    { "room": "301", "floor": 3, "guestCount": 3, "mobilityImpaired": false, "checkoutDate": "2026-04-24" },
    { "room": "304", "floor": 3, "guestCount": 1, "mobilityImpaired": false, "checkoutDate": "2026-04-27" },
    { "room": "401", "floor": 4, "guestCount": 2, "mobilityImpaired": false, "checkoutDate": "2026-04-25" },
    { "room": "407", "floor": 4, "guestCount": 1, "mobilityImpaired": true, "assistanceNote": "Elderly, needs escort", "checkoutDate": "2026-04-26" }
  ]
}
```

---

## THE TASK ASSIGNMENT ENGINE

This is the most important file in the project. It is the "brain."

```typescript
// src/lib/task-engine.ts

import { ollama } from './ollama'
import { prisma } from './prisma'
import { taskPlanSchema, type TaskPlan } from './validators'
import staffData from '../../data/staff.json'
import occupancyData from '../../data/occupancy.json'

export interface IncidentInput {
  type: string
  severity: string
  floor: number
  zone: string
  rawPayload: string
}

export async function generateTaskPlan(incident: IncidentInput): Promise<TaskPlan> {
  // 1. Get current staff snapshot
  const availableStaff = staffData.filter(s => s.available)

  // 2. Get mobility-impaired guests on affected and nearby floors
  const priorityGuests = occupancyData.guests.filter(
    g => g.mobilityImpaired && Math.abs(g.floor - incident.floor) <= 2
  )

  // 3. Build prompt for local LLM
  const prompt = buildSystemPrompt(incident, availableStaff, priorityGuests)

  // 4. Stream response from Ollama (Llama 3.1 8B)
  const raw = await ollama.chat(prompt)

  // 5. Parse and validate LLM output (JSON only)
  const parsed = JSON.parse(extractJSON(raw))
  const validated = taskPlanSchema.parse(parsed)

  return validated
}

function buildSystemPrompt(
  incident: IncidentInput,
  staff: typeof staffData,
  priorityGuests: typeof occupancyData.guests
): string {
  return `
You are NEXUS, a crisis coordination AI for a hotel. You receive incident data and staff availability, and you output a structured JSON task plan.

## INCIDENT
Type: ${incident.type}
Severity: ${incident.severity}
Location: ${incident.zone} (Floor ${incident.floor})
Details: ${incident.rawPayload}

## AVAILABLE STAFF (assign each a task)
${JSON.stringify(staff, null, 2)}

## PRIORITY GUESTS (mobility-impaired, require physical assistance)
${JSON.stringify(priorityGuests, null, 2)}

## YOUR TASK
Generate a JSON task plan that assigns exactly one task per available staff member.
Prioritize: (1) life safety of guests, (2) containment, (3) communication, (4) documentation.
Assign staff closest to the incident to the most urgent tasks.
Staff with FIRE_WARDEN certification should handle fire-related coordination.
Mobility-impaired guests MUST each be assigned a dedicated escort staff member.

## OUTPUT FORMAT (JSON only — no explanation, no markdown, just the JSON object)
{
  "incidentSummary": "One sentence describing what happened and what response is being coordinated.",
  "escalationRecommended": true,
  "estimatedClearTime": "10 minutes",
  "tasks": [
    {
      "staffId": "staff_001",
      "staffName": "Ravi Sharma",
      "staffRole": "SECURITY",
      "description": "Proceed immediately to Floor 3 stairwell B. Direct guests from rooms 301–310 to ground floor assembly point via stairwell. Do not use lifts.",
      "priority": 1,
      "floor": 3,
      "zone": "Stairwell B - Floor 3",
      "reasoning": "Ravi is the nearest security officer with FIRE_WARDEN certification and is already on Floor 1, making them fastest to reach Floor 3."
    }
  ]
}
`
}

function extractJSON(raw: string): string {
  // LLMs sometimes wrap JSON in markdown — strip it
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in LLM response')
  return match[0]
}
```

---

## OLLAMA CLIENT SETUP

```typescript
// src/lib/ollama.ts

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b'

export const ollama = {
  async chat(prompt: string): Promise<string> {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: 'json',         // Force JSON output mode
        options: {
          temperature: 0.1,     // Low temperature = deterministic, structured output
          num_predict: 2048
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response
  }
}
```

---

## ZOD VALIDATORS

```typescript
// src/lib/validators.ts
import { z } from 'zod'

export const taskSchema = z.object({
  staffId: z.string(),
  staffName: z.string(),
  staffRole: z.string(),
  description: z.string().min(10),
  priority: z.number().int().min(1).max(10),
  floor: z.number().int(),
  zone: z.string(),
  reasoning: z.string().optional()
})

export const taskPlanSchema = z.object({
  incidentSummary: z.string(),
  escalationRecommended: z.boolean(),
  estimatedClearTime: z.string(),
  tasks: z.array(taskSchema).min(1)
})

export type Task = z.infer<typeof taskSchema>
export type TaskPlan = z.infer<typeof taskPlanSchema>

export const incidentTriggerSchema = z.object({
  type: z.enum(['FIRE', 'ACTIVE_SHOOTER', 'MEDICAL', 'GAS_LEAK', 'STRUCTURAL', 'EVACUATION', 'SECURITY']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  floor: z.number().int(),
  zone: z.string(),
  source: z.string().optional(),      // "FIRE_PANEL" | "CCTV" | "MANUAL" | "SECURITY_SYSTEM"
  rawPayload: z.string().optional()
})
```

---

## API ROUTES

### POST /api/incident/trigger
Receives an anomaly event from any existing hotel system. This is the single entry point.

```typescript
// src/app/api/incident/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { incidentTriggerSchema } from '@/lib/validators'
import { generateTaskPlan } from '@/lib/task-engine'
import { prisma } from '@/lib/prisma'
import { emitToAll } from '@/lib/socket'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // 1. Validate incoming event
  const parsed = incidentTriggerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const input = parsed.data

  // 2. Create incident record
  const incident = await prisma.incident.create({
    data: {
      type: input.type,
      severity: input.severity,
      floor: input.floor,
      zone: input.zone,
      rawPayload: JSON.stringify(input.rawPayload ?? {}),
      status: 'ACTIVE'
    }
  })

  // 3. Log: incident received
  await prisma.incidentLog.create({
    data: {
      incidentId: incident.id,
      message: `Incident triggered: ${input.type} on Floor ${input.floor} — ${input.zone}`,
      source: 'SENSOR'
    }
  })

  // 4. Broadcast to dashboard immediately (shows "Generating tasks...")
  emitToAll('incident:created', { incident })

  // 5. Generate task plan via local LLM (async — don't block response)
  generateTaskPlan(input).then(async (plan) => {
    // 6. Persist all tasks to DB
    const tasks = await prisma.$transaction(
      plan.tasks.map(task =>
        prisma.task.create({
          data: {
            incidentId: incident.id,
            staffId: task.staffId,
            staffName: task.staffName,
            staffRole: task.staffRole,
            description: task.description,
            priority: task.priority,
            floor: task.floor,
            zone: task.zone,
            llmReasoning: task.reasoning ?? null
          }
        })
      )
    )

    // 7. Log task plan generation
    await prisma.incidentLog.create({
      data: {
        incidentId: incident.id,
        message: `Task plan generated: ${tasks.length} tasks assigned. Estimated clear time: ${plan.estimatedClearTime}`,
        source: 'LLM'
      }
    })

    // 8. Broadcast tasks to dashboard + all staff devices
    emitToAll('tasks:assigned', { incidentId: incident.id, tasks, summary: plan.incidentSummary })

  }).catch(async (err) => {
    await prisma.incidentLog.create({
      data: {
        incidentId: incident.id,
        message: `Task generation failed: ${err.message}. Falling back to manual assignment.`,
        source: 'SYSTEM'
      }
    })
    emitToAll('tasks:error', { incidentId: incident.id, error: err.message })
  })

  return NextResponse.json({ incidentId: incident.id, status: 'PROCESSING' }, { status: 202 })
}
```

### POST /api/tasks/[taskId]/acknowledge
Staff use this to acknowledge their assigned task (from their phone).

```typescript
// src/app/api/tasks/[taskId]/acknowledge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emitToAll } from '@/lib/socket'

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { action } = await req.json()  // "ACKNOWLEDGE" | "COMPLETE"

  const updateData =
    action === 'ACKNOWLEDGE'
      ? { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() }
      : { status: 'DONE', completedAt: new Date() }

  const task = await prisma.task.update({
    where: { id: params.taskId },
    data: updateData
  })

  // Log the update
  await prisma.incidentLog.create({
    data: {
      incidentId: task.incidentId,
      message: `${task.staffName} ${action === 'ACKNOWLEDGE' ? 'acknowledged' : 'completed'} task: "${task.description.substring(0, 60)}..."`,
      source: 'STAFF'
    }
  })

  // Broadcast to command dashboard
  emitToAll('task:updated', { taskId: task.id, status: task.status, staffName: task.staffName })

  return NextResponse.json({ success: true, task })
}
```

---

## SOCKET.IO SERVER

```typescript
// src/lib/socket.ts
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

let io: SocketIOServer | null = null

export function initSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export function emitToAll(event: string, data: unknown) {
  if (io) {
    io.emit(event, data)
  }
}
```

---

## FRONTEND PAGES

### 1. Command Dashboard (`/dashboard`)

This is the duty manager's view. Full-screen, real-time, dark-mode professional UI.

**What it shows:**
- Top bar: Incident type, severity badge, floor/zone, time elapsed since trigger
- Left panel: Live event log (every sensor, LLM, and staff action streams in)
- Center panel: Task kanban board — columns for PENDING / ACKNOWLEDGED / IN PROGRESS / DONE
  - Each card shows staff name, role, description, floor
  - Cards animate across columns as staff acknowledge/complete tasks
- Right panel: Guest accountability — list of all occupied rooms with status (UNACCOUNTED / EVACUATED). Duty manager manually ticks these off as staff report in.
- Bottom bar: LLM summary, estimated clear time, escalation recommendation

**Key interaction:** If the LLM takes >15 seconds (slow hardware), the dashboard shows "Generating task plan..." with a spinner. Tasks appear one-by-one as they are written to the database.

```tsx
// src/app/dashboard/page.tsx — simplified

'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { IncidentHeader } from '@/components/dashboard/IncidentHeader'
import { TaskBoard } from '@/components/dashboard/TaskBoard'
import { LiveFeed } from '@/components/dashboard/LiveFeed'
import { GuestRoll } from '@/components/dashboard/GuestRoll'

export default function DashboardPage() {
  const [incident, setIncident] = useState(null)
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const socket = io()

    socket.on('incident:created', ({ incident }) => {
      setIncident(incident)
      setGenerating(true)
      setLogs(prev => [{
        message: `🚨 Incident detected: ${incident.type} — ${incident.zone}`,
        source: 'SENSOR',
        createdAt: new Date().toISOString()
      }, ...prev])
    })

    socket.on('tasks:assigned', ({ tasks, summary }) => {
      setTasks(tasks)
      setGenerating(false)
      setLogs(prev => [{
        message: `🧠 NEXUS: ${summary}`,
        source: 'LLM',
        createdAt: new Date().toISOString()
      }, ...prev])
    })

    socket.on('task:updated', ({ taskId, status, staffName }) => {
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status } : t)
      )
      setLogs(prev => [{
        message: `✅ ${staffName}: Task ${status.toLowerCase()}`,
        source: 'STAFF',
        createdAt: new Date().toISOString()
      }, ...prev])
    })

    return () => { socket.disconnect() }
  }, [])

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <IncidentHeader incident={incident} />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        <div className="w-72 shrink-0">
          <LiveFeed logs={logs} generating={generating} />
        </div>

        <div className="flex-1 overflow-auto">
          <TaskBoard tasks={tasks} generating={generating} />
        </div>

        <div className="w-64 shrink-0">
          <GuestRoll incident={incident} />
        </div>
      </div>
    </div>
  )
}
```

---

### 2. Staff Task View (`/staff/[staffId]`)

This is what staff see on their personal phone. Simple, clear, mobile-first. No login — staff access via a QR code on a card they carry (or a WhatsApp link generated by the duty manager).

**What it shows:**
- Their name and role
- If no active incident: "All clear. No active incidents."
- If incident active: Full-screen card with their task description in large text
- Two buttons: ACKNOWLEDGE (green) → IN PROGRESS → MARK COMPLETE (blue)
- Secondary info: Floor, zone, priority level

```tsx
// src/app/staff/[staffId]/page.tsx

import { prisma } from '@/lib/prisma'
import { TaskCard } from '@/components/staff/TaskCard'

// Server component — fetches initial state server-side
export default async function StaffPage({ params }: { params: { staffId: string } }) {
  const staffId = params.staffId

  // Find latest active task for this staff member
  const task = await prisma.task.findFirst({
    where: {
      staffId,
      status: { not: 'DONE' },
      incident: { status: 'ACTIVE' }
    },
    include: { incident: true },
    orderBy: { assignedAt: 'desc' }
  })

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center">
      {task ? (
        <TaskCard task={task} />
      ) : (
        <div className="text-center">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <p className="text-xl font-semibold">All Clear</p>
          <p className="text-gray-400 mt-2">No active incident. Stand by.</p>
        </div>
      )}
    </main>
  )
}
```

---

## ENVIRONMENT SETUP

```bash
# .env.local

DATABASE_URL="file:./prisma/nexus.db"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# Optional: use a faster/smaller model for hackathon demo speed
# OLLAMA_MODEL="phi3:mini"
```

---

## RUNNING NEXUS LOCALLY

```bash
# 1. Install Ollama (runs the local LLM)
# macOS/Linux:
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull the model (do this before the hackathon, ~5GB download)
ollama pull llama3.1:8b
# Or for faster/smaller (if laptop is slow):
ollama pull phi3:mini

# 3. Clone & setup project
git clone https://github.com/your-team/nexus
cd nexus
npm install

# 4. Setup database
npx prisma db push
npx prisma db seed

# 5. Run development server
npm run dev
# → Opens on http://localhost:3000

# 6. Test: trigger a simulated incident
curl -X POST http://localhost:3000/api/incident/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FIRE",
    "severity": "HIGH",
    "floor": 3,
    "zone": "Floor 3 East Corridor",
    "source": "FIRE_PANEL",
    "rawPayload": "Zone 3E: Smoke detector activated at 14:30:12. Sprinkler system armed."
  }'

# 7. Open dashboard and watch tasks generate in real-time
open http://localhost:3000/dashboard
```

---

## TEAM DIVISION (4 PEOPLE)

### Person 1 — Backend Core & LLM Engine
**Hours 0–8:** Build the task engine, Ollama client, validators, database schema, seed data
**Hours 8–16:** API routes for incident/trigger, tasks/acknowledge, incident state
**Hours 16–24:** Socket.io setup, prompt refinement, test with multiple incident types

**Key files:** `task-engine.ts`, `ollama.ts`, `validators.ts`, `prisma/schema.prisma`, all `/api/` routes

---

### Person 2 — Command Dashboard Frontend
**Hours 0–4:** Next.js project setup, Tailwind, shadcn/ui, Socket.io client config
**Hours 4–12:** Build `IncidentHeader`, `TaskBoard` (kanban with column animation), `LiveFeed`
**Hours 12–20:** Build `GuestRoll` (accountability tracker), polish dark-mode design
**Hours 20–24:** Connect to real Socket.io events, test with live incident trigger

**Key files:** `dashboard/page.tsx`, `IncidentHeader.tsx`, `TaskBoard.tsx`, `LiveFeed.tsx`, `GuestRoll.tsx`

---

### Person 3 — Staff Mobile Interface & UX
**Hours 0–4:** Design mobile-first `StaffPage` and `TaskCard` layout
**Hours 4–10:** Build `TaskCard` component with ACKNOWLEDGE → IN PROGRESS → DONE state machine
**Hours 10–16:** Build `AckButton` with POST to acknowledge API, optimistic UI updates
**Hours 16–22:** Add QR code generation at `/dashboard` for each staff member's mobile link
**Hours 22–24:** Edge cases: what if staff has no task, incident resolved, network flicker

**Key files:** `staff/[staffId]/page.tsx`, `TaskCard.tsx`, `AckButton.tsx`, QR code component

---

### Person 4 — Integration Simulation & Demo Polish
**Hours 0–6:** Build mock PMS (`/api/pms/occupancy`), mock staff roster (`/api/staff/roster`) endpoints
**Hours 6–12:** Build a "Incident Simulator" UI at `/simulate` — a dev-only panel to fire different incident types with a button click (replaces curl in demo)
**Hours 12–18:** Build a "Hotel View" component — a simple CSS grid floor plan showing which zones are affected and where staff are assigned (bonus visual for demo)
**Hours 18–24:** Demo prep: rehearse full walkthrough, add sample incidents to README, write `DEMO.md`

**Key files:** `/api/pms/`, `/api/staff/`, `simulate/page.tsx`, `hotel-view` component, `DEMO.md`

---

## DEMO SCRIPT (For Hackathon Judges)

**Scenario:** It's 11:15 PM at a 120-room hotel. Fire alarm triggers in the east corridor of Floor 3.

**Step 1: Show "before NEXUS"**
"Tonight, this alarm would reach the duty manager via a crackling radio. She'd start making calls. Engineering, security, housekeeping — all individually. Meanwhile, the guest in room 204 who uses a wheelchair has no idea anyone is coming for her."

**Step 2: Open /dashboard — show it's calm, all clear**
"This is the NEXUS command dashboard. On a normal night, it's quiet. The duty manager glances at it occasionally."

**Step 3: Go to /simulate and fire a FIRE incident on Floor 3**
"A fire panel alert comes in. Watch the dashboard."

**Step 4: Watch incident appear + "Generating tasks..." spinner**
"NEXUS receives the alert instantly. It queries the hotel's PMS — who is on each floor? What's the occupancy? Who among the guests needs physical assistance?"

**Step 5: Watch tasks populate one-by-one on the kanban board**
"In under 10 seconds, NEXUS has read the staff roster, understood who is closest to the incident, who has fire warden certification, who is available — and assigned everyone a specific, plain-English task."

**Step 6: Show GuestRoll — highlight the two mobility-impaired guests**
"NEXUS knows room 204 has a wheelchair user and room 407 has an elderly guest. Both of them have a dedicated escort assigned. That is not something that would happen in a panic."

**Step 7: Pick up phone, go to /staff/staff_001**
"Ravi — security officer on Floor 1 — gets a push notification. He opens NEXUS on his phone." 
[Show the task card: "Proceed to Floor 3 east corridor. Guide guests from rooms 301–310 to ground floor via Stairwell B. Do not use lifts."]

**Step 8: Tap ACKNOWLEDGE — watch dashboard update in real-time**
"He acknowledges. The duty manager sees it instantly."

**Step 9: Show LiveFeed updating with each action**
"Every action is logged. When the incident is over, this is a complete, timestamped audit trail — who did what, when, and in what order."

**Step 10: Close with the key point**
"The hotel's fire sensors worked perfectly. The CCTV system worked perfectly. The building was ready. NEXUS is the piece that was missing — the brain that turns a sensor alert into coordinated human action, in seconds, not minutes."

---

## WHAT TO SKIP FOR NOW

- ❌ Any real external API integration (no RapidSOS, no Bandwidth, no Twilio)
- ❌ Authentication / login system (hardcode staff IDs in the URL for demo)
- ❌ Real PMS integration (JSON file is fine)
- ❌ Multi-property / multi-hotel support
- ❌ Historical analytics / reporting UI
- ❌ Native mobile app (the mobile-responsive Next.js page is sufficient)
- ❌ Blockchain / immutable ledger
- ❌ Augmented reality
- ❌ Predictive forecasting (48-hour engine)
- ❌ Federated learning
- ❌ Hardware integration of any kind

**Cut ruthlessly. A polished demo with 3 working screens beats an impressive spec with 1 broken screen.**

---

## THE PITCH IN ONE PARAGRAPH

NEXUS is a local-first AI crisis coordinator for hotels. When an anomaly is detected by the hotel's existing systems — fire panels, CCTV, security alerts — NEXUS receives the event, queries the hotel's PMS for occupancy data, and uses a local LLM running entirely on the hotel's own hardware to generate a precise, prioritized task plan for every available staff member. Each staff member sees their task on their phone in seconds and can acknowledge and update their status in real-time. The duty manager sees the full picture on a command dashboard — who is doing what, which guests are accounted for, and what still needs attention — without a single radio call, without a single missed notification, and without any dependency on cloud services that go offline during a crisis.

---

*NEXUS — Built for a hackathon. Designed for the real world.*


