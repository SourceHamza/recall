import Link from 'next/link'
import Shader from '@/components/Shader'
import GoogleButton from '@/components/GoogleButton'

export const metadata = { title: 'Recall — save anything worth coming back to' }

export default async function Welcome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <main className="welcome">
      <Shader />
      <div className="welcome-content">
        <p className="welcome-brand">Recall</p>
        <h1>Save anything worth coming back to.</h1>
        <p className="welcome-sub">Links, videos and posts, kept in projects you can search.</p>
        <GoogleButton />
        {error && <p className="form-error" role="alert">Sign-in didn’t finish. Please try again.</p>}
        <Link href="/login" className="welcome-alt">Use email instead</Link>
      </div>
    </main>
  )
}
