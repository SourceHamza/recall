'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SearchIcon } from './icons'

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')

  // Wait 250ms after typing stops, then put the query in the URL (?q=...).
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (value.trim()) next.set('q', value.trim())
      else next.delete('q')
      if (next.toString() !== params.toString()) {
        router.replace(next.size ? `${pathname}?${next}` : pathname)
      }
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <label className="search" role="search">
      <SearchIcon />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search this project"
        aria-label="Search this project"
      />
    </label>
  )
}
