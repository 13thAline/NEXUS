// src/app/login/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { clientAuth, googleProvider } from '@/lib/firebase-client'
import { Activity, Shield } from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const handleSession = async (idToken: string) => {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    
    if (res.ok) {
      router.push(redirectUrl)
    } else {
      throw new Error('Failed to create session')
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password)
      const idToken = await userCredential.user.getIdToken()
      await handleSession(idToken)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithPopup(clientAuth, googleProvider)
      const idToken = await userCredential.user.getIdToken()
      await handleSession(idToken)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Google Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative">
            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl border border-blue-500/20 animate-nexus-radar"></div>
          </div>
          <h1 className="text-4xl font-black tracking-widest uppercase italic mb-2">NEXUS</h1>
          <p className="text-xs text-white/40 uppercase tracking-[0.3em] font-mono">Crisis Coordination Platform</p>
        </div>

        <div className="nexus-glass rounded-3xl p-8 border-white/5">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-[0.2em] text-white/50 uppercase mb-2">Operator ID / Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-white font-mono placeholder:text-white/20"
                  placeholder="operator@nexus.local"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-[0.2em] text-white/50 uppercase mb-2">Passcode</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-white font-mono placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-black text-xs uppercase tracking-[0.2em] transition-all duration-150 disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              {loading ? 'Authenticating...' : 'Establish Uplink'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-bold text-xs transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-3 border border-white/5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-widest">
          <Shield className="w-3 h-3" />
          Secure Connection Required
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
