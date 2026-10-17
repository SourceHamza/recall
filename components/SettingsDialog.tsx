'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsDialog({ userId, email, name, onClose }: { userId: string; email: string; name: string; onClose: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [displayName, setDisplayName] = useState(name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', userId)
    setBusy(false)
    if (error) return setError(error.message)
    router.refresh()
    onClose()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dialog" role="dialog" aria-modal="true" aria-label="Settings" onSubmit={save}>
        <h2>Settings</h2>
        <label className="field">
          Display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} autoFocus />
        </label>
        <p className="muted">Signed in as {email}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" className="btn" onClick={signOut}>Sign out</button>
          <button type="submit" className="btn primary" disabled={busy || !displayName.trim()}>Save changes</button>
        </div>
      </form>
    </div>
  )
}
