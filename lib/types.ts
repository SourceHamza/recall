export type BitType = 'bookmark' | 'video' | 'post'
export type TagColor = 'green' | 'teal' | 'orange' | 'blue' | 'rose'

export type Tag = { id: string; name: string; color: TagColor }
export type Project = { id: string; name: string; is_pinned: boolean; updated_at: string }
export type Bit = {
  id: string
  project_id: string
  type: BitType
  title: string
  description: string | null
  url: string
  thumbnail_url: string | null
  created_at: string
  tags: Tag[]
}
