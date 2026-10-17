import type { BitType, TagColor } from './types'

export const TAG_COLORS: TagColor[] = ['green', 'teal', 'orange', 'blue', 'rose']

export function normalizeUrl(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  try {
    return new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`).href
  } catch {
    return null
  }
}

export function detectType(url: string): BitType {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(host)) return 'video'
    if (/(^|\.)(x\.com|twitter\.com|instagram\.com|linkedin\.com|threads\.net|tiktok\.com)$/.test(host)) return 'post'
  } catch {}
  return 'bookmark'
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC' }) // 01/02/2026

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`
