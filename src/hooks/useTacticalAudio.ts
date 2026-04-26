'use client'

import { useCallback, useRef } from 'react'

export function useTacticalAudio() {
  const audioCtx = useRef<AudioContext | null>(null)

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) => {
    initAudio()
    if (!audioCtx.current) return

    const osc = audioCtx.current.createOscillator()
    const gain = audioCtx.current.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime)
    
    gain.gain.setValueAtTime(volume, audioCtx.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.current.currentTime + duration)

    osc.connect(gain)
    gain.connect(audioCtx.current.destination)

    osc.start()
    osc.stop(audioCtx.current.currentTime + duration)
  }, [])

  const playAlert = useCallback(() => {
    // Tactical Low Pulse (Incident Trigger)
    playTone(150, 0.5, 'square', 0.05)
    setTimeout(() => playTone(100, 0.8, 'square', 0.05), 200)
  }, [playTone])

  const playChirp = useCallback(() => {
    // High-pitched Uplink Chirp (Task Success / AI Ready)
    playTone(880, 0.1, 'sine', 0.1)
    setTimeout(() => playTone(1760, 0.1, 'sine', 0.05), 50)
  }, [playTone])

  const playPing = useCallback(() => {
    // Subtle UI feedback
    playTone(440, 0.05, 'sine', 0.02)
  }, [playTone])

  return { playAlert, playChirp, playPing }
}
