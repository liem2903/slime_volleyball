import { useParams } from 'react-router-dom'
import PersonRow from '../components/PersonRow'
import type { Player, WaitList, SessionResult } from '../types'

// Mock data standing in for a GET /api/player/:playerId (or similar) endpoint that
// resolves the personal link's token to a session + roster + "which one is me".
// Swap this block out once that endpoint exists.
const MOCK_SESSION: SessionResult = {
  id: 'sess-mock-1',
  host_name: 'Alex',
  admin_token_hash: '',
  time_start: '6:00 PM',
  time_end: '8:00 PM',
  cost_cents: 500,
  capacity: 12,
  court_name: 'Court A',
  date: '1 August 2026',
}

const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'Jamie' },
  { id: 'p2', name: 'Sam' },
  { id: 'p3', name: 'Taylor' },
  { id: 'p4', name: 'Riley' },
]

const MOCK_WAITLIST: WaitList[] = [{ id: 'p5', name: 'Morgan' }]

const MOCK_TOKEN_TO_PLAYER_ID: Record<string, string> = {
  'mock-token-abc123': 'p3',
}
const MOCK_DEFAULT_PLAYER_ID = 'p3'

function PlayerPage() {
  const { playerId } = useParams<string>()
  const sessionInformation = MOCK_SESSION
  const players = MOCK_PLAYERS
  const waitlist = MOCK_WAITLIST
  const myPlayerId = (playerId && MOCK_TOKEN_TO_PLAYER_ID[playerId]) ?? MOCK_DEFAULT_PLAYER_ID

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-400">
        {players.length}/{sessionInformation.capacity} players
      </p>
      <h1 className="mt-2 text-center text-5xl font-extrabold tracking-tight text-emerald-400">
        {sessionInformation.court_name ?? `${sessionInformation.host_name} session`}
      </h1>
      <p className="mt-3 text-neutral-500">
        {sessionInformation.date} {sessionInformation.time_start}–{sessionInformation.time_end}
      </p>

      <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Players in session
          </h2>
          <div className="space-y-3">
            {players.map((player) => (
              <PersonRow key={player.id} name={player.name} highlighted={player.id === myPlayerId} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Waitlist
          </h2>
          <div className="space-y-3">
            {waitlist.length > 0 ? (
              waitlist.map((person) => (
                <PersonRow key={person.id} name={person.name} highlighted={person.id === myPlayerId} />
              ))
            ) : (
              <p className="text-sm text-neutral-400">No one's waiting right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerPage
