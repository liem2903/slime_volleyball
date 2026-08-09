import { useState } from 'react'
import { playClickSound } from '../lib/sound'

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
    courtName: string,
    hostIsPlayer: boolean,
  ) => void
}) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [capacity, setCapacity] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [price, setPrice] = useState('')
  const [courtName, setCourtName] = useState('')
  const [hostIsPlayer, setHostIsPlayer] = useState(true)
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
      Number(price) < 0 ||
      !courtName.trim()
    ) {
      setError("Don't forget all the details! \u{1F97A}")
      return
    }
    if (endTime <= startTime) {
      setError('End time should be after the start time! \u{1F97A}')
      return
    }
    playClickSound()
    onSubmit(email, username, Number(capacity), date, startTime, endTime, Number(price), courtName.trim(), hostIsPlayer)
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
              Court name
            </label>
            <input
              type="text"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="Sunset Beach Court 3"
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
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={hostIsPlayer}
              onChange={(e) => setHostIsPlayer(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-emerald-400 focus:ring-emerald-200"
            />
            Count me as a player
          </label>
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

export default JoinInfoPopup
