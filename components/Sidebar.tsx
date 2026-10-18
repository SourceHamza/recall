'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initials } from '@/lib/utils'
import type { Project } from '@/lib/types'
import { FolderIcon, PinIcon, PlusIcon, StackIcon, TrashIcon } from './icons'
import AddBitDialog from './AddBitDialog'
import SettingsDialog from './SettingsDialog'

type Props = { projects: Project[]; userId: string; email: string; name: string }

export default function Sidebar({ projects, userId, email, name }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const { id: activeId } = useParams<{ id?: string }>()
  const [adding, setAdding] = useState(false)
  const [settings, setSettings] = useState(false)
  const [naming, setNaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState(projects)
  useEffect(() => setItems(projects), [projects])

  const pinned = items.filter((p) => p.is_pinned)
  const rest = items.filter((p) => !p.is_pinned)

  async function togglePin(p: Project) {
    const { error } = await supabase.from('projects').update({ is_pinned: !p.is_pinned }).eq('id', p.id)
    if (error) setError(error.message)
    else router.refresh()
  }

  async function deleteProject(p: Project) {
    if (!window.confirm(`Delete "${p.name}" and all its bits? This can't be undone.`)) return
    const { error } = await supabase.from('projects').delete().eq('id', p.id)
    if (error) return setError(error.message)
    setItems((prev) => prev.filter((x) => x.id !== p.id))
    if (p.id === activeId) router.push('/') // "/" redirects to another project, or shows the empty state
    router.refresh()
  }

  async function createProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const projectName = String(new FormData(e.currentTarget).get('name') ?? '').trim()
    if (!projectName) return setNaming(false)
    const { data, error } = await supabase.from('projects').insert({ name: projectName }).select('id').single()
    if (error || !data) return setError(error?.message ?? 'Could not create the project')
    setItems((prev) => [
      ...prev,
      { id: data.id, name: projectName, is_pinned: false, updated_at: new Date().toISOString() },
    ])
    setNaming(false)
    setError(null)
    router.push(`/p/${data.id}`)
    router.refresh()
  }

  const row = (p: Project) => (
    <li key={p.id} className={`proj${p.id === activeId ? ' is-active' : ''}`}>
      <Link href={`/p/${p.id}`} className="proj-link">
        <FolderIcon />
        <span>{p.name}</span>
      </Link>
      <button
        className="pin-btn"
        data-on={p.is_pinned}
        aria-label={p.is_pinned ? `Unpin ${p.name}` : `Pin ${p.name}`}
        onClick={() => togglePin(p)}
      >
        <PinIcon size={14} />
      </button>
      <button
        className="pin-btn"
        aria-label={`Delete ${p.name}`}
        onClick={() => deleteProject(p)}
      >
        <TrashIcon size={15} />
      </button>
    </li>
  )

  return (
    <aside className="sidebar">
      <header className="sb-head">
        <span className="brand">Recall</span>
        <button className="add-btn" aria-label="Add a bit" onClick={() => setAdding(true)}>
          <PlusIcon />
        </button>
      </header>

      <nav className="sb-nav" aria-label="Projects">
        {pinned.length > 0 && (
          <section className="sb-section">
            <h2 className="sb-title"><PinIcon />Pinned</h2>
            <ul className="sb-list">{pinned.map(row)}</ul>
          </section>
        )}
        <section className="sb-section">
          <h2 className="sb-title">
            <StackIcon />Projects
            <button className="mini-add" aria-label="New project" onClick={() => setNaming(true)}>
              <PlusIcon />
            </button>
          </h2>
          <ul className="sb-list">
            {rest.map(row)}
            {naming && (
              <li className="new-project">
                <form onSubmit={createProject}>
                  <input name="name" autoFocus maxLength={80} placeholder="Project name" aria-label="Project name" onBlur={() => setNaming(false)} />
                </form>
              </li>
            )}
          </ul>
          {error && <p className="form-error" role="alert">{error}</p>}
        </section>
      </nav>

      <button className="profile" onClick={() => setSettings(true)} aria-label="Profile and settings">
        <span className="avatar">{initials(name)}</span>
        <span>{name}</span>
      </button>

      {adding && <AddBitDialog projects={projects} defaultProjectId={activeId} onClose={() => setAdding(false)} />}
      {settings && <SettingsDialog userId={userId} email={email} name={name} onClose={() => setSettings(false)} />}
    </aside>
  )
}
