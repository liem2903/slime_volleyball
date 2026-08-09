import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { playClickSound } from '../lib/sound'
import PersonRow from '../components/PersonRow'
import { convertDateToAbbreviation, convertTimeToMeredian } from '../helpers/sessionHelpers'
import type { Player, WaitList, SessionResult } from '../types'

function PlayerPage() {
  const { userToken, sessionId } = useParams<string>()

  const [sessionInformation, setSessionInformation] = useState<SessionResult>()
  const [players, setPlayers] = useState<Player[]>([])
  const [waitlist, setWaitlist] = useState<WaitList[]>([])
  const [ myPlayerId, setMyPlayerId ] = useState<String>("");

  const [isLeaving, setIsLeaving] = useState(false)
  const [hasLeft, setHasLeft] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  const fetchSessionData = async (sessionId: string | undefined) => {
    const sessionInfo: SessionResult = (await axios.get(`/api/session/${sessionId}`)).data.data

    const newSessionInfo: SessionResult = {
      ...sessionInfo,
      date: convertDateToAbbreviation(sessionInfo.date),
      time_start: convertTimeToMeredian(sessionInfo.time_start),
      time_end: convertTimeToMeredian(sessionInfo.time_end),
    }
    setSessionInformation(newSessionInfo)
  }

  const fetchPlayers = async (sessionId: string | undefined) => {
    const players: Player[] = (await axios.get(`/api/players/${sessionId}`)).data.data

    setPlayers(players)
  }

  const fetchWaitlist = async (sessionId: string | undefined) => {
    const waitList: WaitList[] = (await axios.get(`/api/players/waitlist/${sessionId}`)).data.data;
    setWaitlist(waitList)
  }

  const fetchMyId = async () => {    
    const myPlayerId: String = (await axios.get(`/api/players/${userToken}`)).data.data;
    setMyPlayerId(myPlayerId);
  }

  useEffect(() => {
    fetchSessionData(sessionId);
    fetchPlayers(sessionId);
    fetchWaitlist(sessionId);
    fetchMyId();
  }, [sessionId])

  const handleLeaveSession = async () => {
    playClickSound()
    setIsLeaving(true)
    setLeaveError(null)

    try {
      await axios.delete(`/api/players/delete/${sessionId}/${userToken}`)

      await Promise.all([fetchPlayers(sessionId), fetchWaitlist(sessionId)])

      setHasLeft(true)
    } catch {
      setLeaveError('Something went wrong. Please try again.')
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-400">
        {sessionInformation?.player_count}/{sessionInformation?.capacity} players
      </p>
      <h1 className="mt-2 text-center text-5xl font-extrabold tracking-tight text-emerald-400">
        {sessionInformation?.court_name ?? `${sessionInformation?.host_name} session`}
      </h1>
      <p className="mt-3 text-neutral-500">
        {sessionInformation?.date} {sessionInformation?.time_start}–{sessionInformation?.time_end}
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

      {myPlayerId && (
        hasLeft ? (
          <p className="mt-16 text-center text-sm font-medium text-neutral-500">
            You've left the session.
          </p>
        ) : (
          <div className="mt-16 flex w-full max-w-sm flex-col items-center gap-3">
            <button
              onClick={handleLeaveSession}
              disabled={isLeaving}
              className="w-full cursor-pointer rounded-full bg-rose-200 px-8 py-4 font-semibold text-neutral-800 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-rose-300 hover:shadow-md active:scale-95 active:bg-rose-400 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLeaving ? 'Leaving…' : 'Leave Session'}
            </button>
            {leaveError && <p className="text-sm text-rose-500">{leaveError}</p>}
          </div>
        )
      )}
    </div>
  )
}

export default PlayerPage
