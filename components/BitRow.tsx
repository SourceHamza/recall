'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Bit, Project } from '@/lib/types'
import AddBitDialog from './AddBitDialog'
import { formatDate } from '@/lib/utils'

export default function BitRow({ bit, author, projects }: { bit: Bit; author: string; projects: Project[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [editing, setEditing] = useState(false)

  // Close the menu on any click, scroll or Escape
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  async function remove() {
    if (!window.confirm(`Delete "${bit.title}"? This can't be undone.`)) return
    const { error } = await supabase.from('bits').delete().eq('id', bit.id)
    if (error) return window.alert(error.message)
    router.refresh()
  }

  return (
    <>
      <article
        className="bit"
        onContextMenu={(e) => {
          e.preventDefault()
          setMenu({
            x: Math.min(e.clientX, window.innerWidth - 170),
            y: Math.min(e.clientY, window.innerHeight - 90),
          })
        }}
      >

        <div className="thumb">
          {bit.thumbnail_url ? (
            <img src={bit.thumbnail_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            bit.title.charAt(0).toUpperCase()
          )}
        </div>
        <div className="bit-body">
          <h3 className="bit-title">
            <a href={bit.url} target="_blank" rel="noopener noreferrer">{bit.title}</a>
          </h3>
          {bit.description && <p className="bit-desc">{bit.description}</p>}
          {bit.tags.length > 0 && (
            <ul className="tags">
              {bit.tags.map((t) => (
                <li key={t.id} className="tag" data-c={t.color}>#{t.name}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="bit-meta">
          Created by <b>{author}</b>
          <time dateTime={bit.created_at}>{formatDate(bit.created_at)}</time>
        </p>
      </article>

      {menu && (
        <div className="ctx" style={{ left: menu.x, top: menu.y }} role="menu">
          <button role="menuitem" onClick={() => setEditing(true)}>Edit</button>
          <button role="menuitem" className="danger" onClick={remove}>Delete</button>
        </div>
      )}
      {editing && <AddBitDialog bit={bit} projects={projects} onClose={() => setEditing(false)} />}
    </>
  )
}
