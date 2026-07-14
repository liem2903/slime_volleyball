import { useState } from 'react'
import axios from 'axios'

interface Session {
  hostLink: string
  joinLink: string
  capacity: number
  date: string
  startTime: string
  endTime: string
  price: number
}

function createPlaceholderSession(
  capacity: number,
  date: string,
  startTime: string,
  endTime: string,
  price: number,
): Session {
  const id = Math.random().toString(36).slice(2, 8)
  return {
    hostLink: `slime.gg/host/${id}`,
    joinLink: `slime.gg/join/${id}`,
    capacity,
    date,
    startTime,
    endTime,
    price,
  }
}

let audioCtx: AudioContext | null = null

function playClickSound() {
  audioCtx ??= new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const oscillator = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(600, audioCtx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.08)

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15)

  oscillator.connect(gain)
  gain.connect(audioCtx.destination)
  oscillator.start()
  oscillator.stop(audioCtx.currentTime + 0.15)
}

function LinkRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-neutral-700">{value}</p>
    </div>
  )
}

function JoinInfoPopup({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (
    email: string,
    username: string,
    capacity: number,
    date: string,
    startTime: string,
    endTime: string,
    price: number,
  ) => void
}) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [capacity, setCapacity] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (
      !email.trim() ||
      !username.trim() ||
      !capacity.trim() ||
      Number(capacity) <= 0 ||
      !date.trim() ||
      !startTime.trim() ||
      !endTime.trim() ||
      !price.trim() ||
      Number(price) < 0
    ) {
      setError("Don't forget all the details! \u{1F97A}")
      return
    }
    if (endTime <= startTime) {
      setError('End time should be after the start time! \u{1F97A}')
      return
    }
    playClickSound()
    onSubmit(email, username, Number(capacity), date, startTime, endTime, Number(price))
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-neutral-900/30 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer text-xl leading-none text-neutral-400 hover:text-neutral-600"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-emerald-400">Who's hosting?</h2>
        <p className="mt-1 text-sm text-neutral-500">Just need a couple things first!</p>

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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="SlimeChamp99"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="6"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full cursor-pointer rounded-full bg-amber-200 px-8 py-3 font-semibold text-neutral-800 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-amber-300 hover:shadow-md active:scale-95 active:bg-amber-400 active:shadow-sm"
        >
          Let's play!
        </button>
      </div>
    </div>
  )
}

function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-20">
      <h1 className="text-5xl font-extrabold tracking-tight text-emerald-400">
        Slime Volleyball
      </h1>
      <p className="mt-3 text-neutral-500">Host a match, share a link, start playing.</p>

      <div className="mt-16 w-full max-w-sm">
        {!session ? (
          <button
            onClick={() => {
              playClickSound()
              setIsPopupOpen(true)
            }}
            className="w-full cursor-pointer rounded-full bg-amber-200 px-8 py-4 font-semibold text-neutral-800 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-amber-300 hover:shadow-md active:scale-95 active:bg-amber-400 active:shadow-sm"
          >
            Create Session
          </button>
        ) : (
          <div className="space-y-3">
            <LinkRow label="Your host link" value={session.hostLink} />
            <LinkRow label="Share with players" value={session.joinLink} />
            <p className="text-center text-sm text-neutral-400">
              Capacity: {session.capacity} players
            </p>
            <p className="text-center text-sm text-neutral-400">
              {session.date}, {session.startTime}–{session.endTime}
            </p>
            <p className="text-center text-sm text-neutral-400">
              Price: ${session.price.toFixed(2)}
            </p>
            <button
              onClick={() => setSession(null)}
              className="mx-auto block pt-2 text-sm text-neutral-400 underline hover:text-neutral-600"
            >
              Start over
            </button>
          </div>
        )}
      </div>

      {isPopupOpen && (
        <JoinInfoPopup
          onClose={() => setIsPopupOpen(false)}
          onSubmit={(email, username, capacity, date, startTime, endTime, price) => {
            const session_details = {capacity, date, startTime, endTime, price, email, username};
            axios.post("/api/session/create", session_details);
            setSession(createPlaceholderSession(capacity, date, startTime, endTime, price))
            setIsPopupOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default HomePage
