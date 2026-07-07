import { useState } from 'react'

interface Session {
  hostLink: string
  joinLink: string
}

function createPlaceholderSession(): Session {
  const id = Math.random().toString(36).slice(2, 8)
  return {
    hostLink: `slime.gg/host/${id}`,
    joinLink: `slime.gg/join/${id}`,
  }
}

function LinkRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-neutral-700">{value}</p>
    </div>
  )
}

function HomePage() {
  const [session, setSession] = useState<Session | null>(null)

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-20">
      <h1 className="text-5xl font-extrabold tracking-tight text-emerald-400">
        Slime Volleyball
      </h1>
      <p className="mt-3 text-neutral-500">Host a match, share a link, start playing.</p>

      <div className="mt-16 w-full max-w-sm">
        {!session ? (
          <button
            onClick={() => setSession(createPlaceholderSession())}
            className="w-full rounded-full bg-amber-200 px-8 py-4 font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-amber-300"
          >
            Create Session
          </button>
        ) : (
          <div className="space-y-3">
            <LinkRow label="Your host link" value={session.hostLink} />
            <LinkRow label="Share with players" value={session.joinLink} />
            <button
              onClick={() => setSession(null)}
              className="mx-auto block pt-2 text-sm text-neutral-400 underline hover:text-neutral-600"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
