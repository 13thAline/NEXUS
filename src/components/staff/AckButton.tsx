// src/components/staff/AckButton.tsx — Acknowledge/Complete button
'use client'

import { useState } from 'react'
import type { TaskStatus } from '@/types'

interface AckButtonProps {
  taskId: string
  currentStatus: TaskStatus
  onStatusChange: (newStatus: TaskStatus) => void
}

export function AckButton({ taskId, currentStatus, onStatusChange }: AckButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'ACKNOWLEDGE' | 'COMPLETE') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        console.log(`[Staff] Task ${action} successful for ID: ${taskId}`)
        onStatusChange(action === 'ACKNOWLEDGE' ? 'ACKNOWLEDGED' : 'COMPLETE')
      } else {
        const errData = await res.json().catch(() => ({ error: 'Server error' }))
        console.error(`[Staff] Task ${action} failed:`, errData.error)
        alert(`Action Failed: ${errData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('Network error: Could not reach the NEXUS server.')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'COMPLETE') {
    return (
      <div className="w-full py-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
        <span className="text-green-400 font-semibold text-lg">✓ Task Completed</span>
      </div>
    )
  }

  if (currentStatus === 'ACKNOWLEDGED') {
    return (
      <button
        onClick={() => handleAction('COMPLETE')}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-lg transition-all duration-150 disabled:opacity-50"
      >
        {loading ? 'Updating...' : '✓ MARK COMPLETE'}
      </button>
    )
  }

  return (
    <button
      onClick={() => handleAction('ACKNOWLEDGE')}
      disabled={loading}
      className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold text-lg transition-all duration-150 disabled:opacity-50 animate-nexus-pulse"
    >
      {loading ? 'Updating...' : '✋ ACKNOWLEDGE TASK'}
    </button>
  )
}
