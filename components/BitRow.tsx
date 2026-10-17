import type { Bit } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function BitRow({ bit, author }: { bit: Bit; author: string }) {
  return (
    <article className="bit">
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
  )
}
