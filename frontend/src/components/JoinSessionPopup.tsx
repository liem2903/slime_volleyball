import { useState } from 'react'
import { playClickSound } from '../lib/sound'

function JoinSessionPopup({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (email: string, name: string) => void
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!email.trim() || !name.trim()) {
      setError('Please enter your name and email.')
      return
    }
    playClickSound()
    onSubmit(email, name)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-neutral-900/30 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer text-xl leading-none text-neutral-400 hover:text-neutral-600"
        >
          &times;
        </button>

        <h2 className="text-lg font-semibold text-neutral-900">Join this session</h2>
        <p className="mt-1 text-sm text-neutral-500">Enter your details to continue.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full cursor-pointer rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-amber-700 active:bg-amber-800"
        >
          Join session
        </button>
      </div>
    </div>
  )
}

export default JoinSessionPopup
