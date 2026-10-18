type P = { size?: number }
const base = (size = 16) => ({ width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true as const })

export const FolderIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path fill="currentColor" d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.1c.4 0 .78.16 1.06.44l.78.76H13A1.5 1.5 0 0 1 14.5 4.7v7.8A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5z" />
  </svg>
)
export const PinIcon = ({ size = 13 }: P) => (
  <svg {...base(size)}>
    <path fill="currentColor" d="M9.6 1.4 14.6 6.4l-1.7.6-2.3 2.3.4 2.7-.9.9L6.3 9.4l-3 3-.7-.7 3-3L1.5 5.6l.9-.9 2.7.4L7.4 2.8z" />
  </svg>
)
export const StackIcon = ({ size = 13 }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="2" width="10" height="4.5" rx="1.2" fill="currentColor" />
    <rect x="2" y="8" width="12" height="6" rx="1.4" fill="currentColor" />
  </svg>
)
export const PlusIcon = ({ size = 10 }: P) => (
  <svg {...base(size)} viewBox="0 0 10 10">
    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)
export const SearchIcon = ({ size = 13 }: P) => (
  <svg {...base(size)} viewBox="0 0 14 14">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

export const TrashIcon = ({ size = 13 }: P) => (
  <svg {...base(size)}>
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
