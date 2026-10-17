import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Fetches title / description / image from a page so the "add bit" form can prefill.
const PRIVATE_HOST = /^(localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$)/i

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function parseMeta(html: string) {
  const out = new Map<string, string>()
  for (const tag of html.match(/<meta\s[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {}
    for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? ''
    }
    const key = (attrs.property ?? attrs.name)?.toLowerCase()
    if (key && attrs.content && !out.has(key)) out.set(key, decode(attrs.content))
  }
  return out
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const raw = new URL(request.url).searchParams.get('url') ?? ''
  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  if (!/^https?:$/.test(target.protocol) || PRIVATE_HOST.test(target.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
  }

  try {
    const res = await fetch(target, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; RecallBot/1.0)' },
      signal: AbortSignal.timeout(6000),
    })
    const html = (await res.text()).slice(0, 300_000)
    const meta = parseMeta(html)
    const pageTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]
    const image = meta.get('og:image') ?? meta.get('twitter:image')

    return NextResponse.json({
      title: meta.get('og:title') ?? meta.get('twitter:title') ?? (pageTitle ? decode(pageTitle.trim()) : null),
      description: meta.get('og:description') ?? meta.get('description') ?? null,
      image: image ? new URL(image, target).href : null,
    })
  } catch {
    return NextResponse.json({ title: null, description: null, image: null })
  }
}
