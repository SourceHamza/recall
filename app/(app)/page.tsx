import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id')
    .order('is_pinned', { ascending: false })
    .order('created_at')
    .limit(1)

  if (data?.[0]) redirect(`/p/${data[0].id}`)

  return (
    <div className="panel">
      <div className="empty">
        <strong>No projects yet</strong>
        <p>Use the + next to Projects to create your first one.</p>
      </div>
    </div>
  )
}
