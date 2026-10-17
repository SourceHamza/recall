import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('id, name, is_pinned, updated_at').order('created_at'),
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
  ])

  return (
    <div className="shell">
      <Sidebar
        projects={projects ?? []}
        userId={user.id}
        email={user.email ?? ''}
        name={profile?.display_name || user.email?.split('@')[0] || 'You'}
      />
      <main className="main">{children}</main>
    </div>
  )
}
