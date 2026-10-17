'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { data, error } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return setMessage(error.message)
    if (!data.session) return setMessage('Check your email to confirm your account, then sign in.')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="login">
      <form onSubmit={submit} className="dialog">
        <h1>{mode === 'in' ? 'Sign in to Recall' : 'Create your Recall account'}</h1>
        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </label>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button className="btn primary" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="link-btn" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
