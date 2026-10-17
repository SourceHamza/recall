import type { SupabaseClient } from '@supabase/supabase-js'
import type { Bit, Tag } from './types'

const BIT_SELECT =
  'id, project_id, type, title, description, url, thumbnail_url, created_at, bit_tags(tags(id, name, color))'

// The ONE place bits are listed/searched. When you add semantic search, embed `q`
// here, call supabase.rpc('match_bits', ...), then fetch those ids with the same
// BIT_SELECT. Nothing else in the app needs to change.
export async function searchBits(
  supabase: SupabaseClient,
  { projectId, q }: { projectId: string; q?: string }
): Promise<Bit[]> {
  let query = supabase
    .from('bits')
    .select(BIT_SELECT)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const term = q?.replace(/[%,()*\\]/g, ' ').trim()
  if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => ({
    ...row,
    tags: (row.bit_tags ?? []).map((bt: { tags: Tag }) => bt.tags).filter(Boolean),
  }))
}
