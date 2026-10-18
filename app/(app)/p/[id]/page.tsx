import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { searchBits } from '@/lib/search'
import { formatDate, plural } from '@/lib/utils'
import SearchBar from '@/components/SearchBar'
import BitRow from '@/components/BitRow'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { id } = await params
  const { q } = await searchParams

  const supabase = await createClient()

const { data: projects } = await supabase
  .from('projects')
  .select('id, name, is_pinned, updated_at')
  .order('created_at')

const project = projects?.find((p) => p.id === id)
if (!project) notFound()




  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user!.id).maybeSingle()
  const author = profile?.display_name || user?.email?.split('@')[0] || 'You'

  const bits = await searchBits(supabase, { projectId: id, q })
  const count = (t: string) => bits.filter((b) => b.type === t).length

  return (
    <>
      <SearchBar key={id} />
      <section className="panel" aria-label={project.name}>
        <div className="panel-head">
          <span>last updated {formatDate(project.updated_at)}</span>
          <span className="counts">
            <span>{plural(count('bookmark'), 'bookmark')}</span>
            <span>{plural(count('video'), 'video')}</span>
            <span>{plural(count('post'), 'post embed')}</span>
          </span>
        </div>
        {bits.length === 0 ? (
          <div className="empty">
            <strong>{q ? `No bits match “${q}”` : 'Nothing saved here yet'}</strong>
            {!q && <p>Use the + at the top of the sidebar to add a bit.</p>}
          </div>
        ) : (
          <div className="bits">
            {bits.map((bit) => (
              <BitRow key={bit.id} bit={bit} author={author} projects={projects ?? []} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
