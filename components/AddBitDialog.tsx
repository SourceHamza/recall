'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TAG_COLORS, detectType, normalizeUrl } from '@/lib/utils'
import type { BitType, Project, Tag } from '@/lib/types'

const TYPES: { value: BitType; label: string }[] = [
  { value: 'bookmark', label: 'Bookmark' },
  { value: 'video', label: 'Video' },
  { value: 'post', label: 'Post embed' },
]

type Props = { projects: Project[]; defaultProjectId?: string; onClose: () => void }

export default function AddBitDialog({ projects, defaultProjectId, onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const { id: currentId } = useParams<{ id?: string }>()

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumb, setThumb] = useState<string | null>(null)
  const [type, setType] = useState<BitType>('bookmark')
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [known, setKnown] = useState<Tag[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('tags').select('id, name, color').order('name').then(({ data }) => setKnown((data as Tag[]) ?? []))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When a link is pasted, fetch its title / description / image and guess the type.
  async function prefill() {
    const clean = normalizeUrl(url)
    if (!clean) return
    setType(detectType(clean))
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(clean)}`)
      const meta = await res.json()
      setTitle((t) => t || meta.title || '')
      setDescription((d) => d || meta.description || '')
      setThumb((x) => x || meta.image || null)
    } catch {}
  }

  function addTag(raw: string) {
    const name = raw.trim().replace(/^#/, '').toLowerCase()
    if (name && !tags.includes(name)) setTags([...tags, name])
    setTagInput('')
  }

  const colorOf = (name: string) => known.find((k) => k.name === name)?.color ?? 'green'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const clean = normalizeUrl(url)
    if (!clean) return setError('Enter a valid link.')
    if (!projectId) return setError('Choose a project.')
    setBusy(true)
    setError(null)

    const fail = (msg: string) => { setBusy(false); setError(msg) }
    const pending = tagInput.trim() ? [...tags, tagInput.trim().replace(/^#/, '').toLowerCase()] : tags
    const names = [...new Set(pending)]

    // Reuse tags that already exist, create the rest.
    const tagIds = names.map((n) => known.find((k) => k.name === n)?.id).filter(Boolean) as string[]
    const fresh = names
      .filter((n) => !known.some((k) => k.name === n))
      .map((name, i) => ({ name, color: TAG_COLORS[(known.length + i) % TAG_COLORS.length] }))
    if (fresh.length) {
      const { data, error } = await supabase.from('tags').insert(fresh).select('id')
      if (error) return fail(error.message)
      tagIds.push(...(data ?? []).map((t) => t.id))
    }

    const { data: bit, error: bitError } = await supabase
      .from('bits')
      .insert({
        project_id: projectId,
        type,
        title: title.trim() || new URL(clean).hostname.replace(/^www\./, ''),
        description: description.trim() || null,
        url: clean,
        thumbnail_url: thumb,
      })
      .select('id')
      .single()
    if (bitError || !bit) return fail(bitError?.message ?? 'Could not save the bit.')

    if (tagIds.length) {
      const { error } = await supabase.from('bit_tags').insert(tagIds.map((tag_id) => ({ bit_id: bit.id, tag_id })))
      if (error) return fail(error.message)
    }

    router.refresh()
    if (projectId !== currentId) router.push(`/p/${projectId}`)
    onClose()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dialog" role="dialog" aria-modal="true" aria-label="Add a bit" onSubmit={submit}>
        <h2>Add a bit</h2>

        {projects.length === 0 ? (
          <>
            <p className="muted">Create a project first, then add bits to it.</p>
            <div className="actions"><button type="button" className="btn" onClick={onClose}>Close</button></div>
          </>
        ) : (
          <>
            <label className="field">
              Link
              <input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={prefill} placeholder="Paste a link" autoFocus />
            </label>
            <label className="field">
              Heading
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="field">
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <div className="row">
              <label className="field">
                Type
                <select value={type} onChange={(e) => setType(e.target.value as BitType)}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="field">
                Project
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            </div>
            <div className="field">
              <label htmlFor="tag-input">Tags</label>
              <div className="chips">
                {tags.map((t) => (
                  <span key={t} className="tag" data-c={colorOf(t)}>
                    #{t}
                    <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>×</button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  list="known-tags"
                  value={tagInput}
                  placeholder={tags.length ? '' : 'Type a tag, press Enter'}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                    else if (e.key === 'Backspace' && !tagInput) setTags(tags.slice(0, -1))
                  }}
                />
                <datalist id="known-tags">{known.map((k) => <option key={k.id} value={k.name} />)}</datalist>
              </div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="actions">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn primary" disabled={busy || !url.trim()}>Save bit</button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
