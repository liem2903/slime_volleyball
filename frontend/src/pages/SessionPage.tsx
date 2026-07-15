import { useState } from 'react'
import { playClickSound } from '../lib/sound'
import PersonRow from '../components/PersonRow'
import JoinSessionPopup from '../components/JoinSessionPopup'

// --- PLACEHOLDER DATA (delete this block once the backend is wired up) ---
const PLACEHOLDER_SESSION = {
  courtName: 'Sunset Beach Court 3',
  date: 'July 19, 2026',
  startTime: '4:00 PM',
  endTime: '6:00 PM',
  capacity: 8,
  players: ['Sandy Slime', 'Kevin Bump', 'Ava Setter', 'Marco Spike'],
  waitlist: ['Priya Dig', 'Owen Ace'],
}

function SessionPage() {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  // Placeholder join flow (no backend yet) — swap for real state once players come from the API.
  const [players, setPlayers] = useState(PLACEHOLDER_SESSION.players)

  const { courtName, date, startTime, endTime, capacity, waitlist } = PLACEHOLDER_SESSION

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-400">
        {players.length}/{capacity} players
      </p>
      <h1 className="mt-2 text-center text-5xl font-extrabold tracking-tight text-emerald-400">
        {courtName}
      </h1>
      <p className="mt-3 text-neutral-500">
        {date}, {startTime}–{endTime}
      </p>

      <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Players in session
          </h2>
          <div className="space-y-3">
            {players.map((name) => (
              <PersonRow key={name} name={name} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Waitlist
          </h2>
          <div className="space-y-3">
            {waitlist.length > 0 ? (
              waitlist.map((name) => <PersonRow key={name} name={name} />)
            ) : (
              <p className="text-sm text-neutral-400">No one's waiting right now.</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          playClickSound()
          setIsPopupOpen(true)
        }}
        className="mt-16 w-full max-w-sm cursor-pointer rounded-full bg-amber-200 px-8 py-4 font-semibold text-neutral-800 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-amber-300 hover:shadow-md active:scale-95 active:bg-amber-400 active:shadow-sm"
      >
        Join Session
      </button>

      {isPopupOpen && (
        <JoinSessionPopup
          onClose={() => setIsPopupOpen(false)}
          onSubmit={(_email, name) => {
            // TODO: replace with a real API call once the backend join endpoint exists.
            setPlayers((prev) => [...prev, name])
            setIsPopupOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default SessionPage
