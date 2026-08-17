import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { playClickSound } from '../lib/sound'
import PersonRow from '../components/PersonRow'
import StatusBadge from '../components/StatusBadge'
import SetPositionPopup from '../components/SetPositionPopup'
import { convertDateToAbbreviation, convertTimeToMeredian, formatCentsToDollars } from '../helpers/sessionHelpers'
import type { Player, WaitList, SessionResult, PlayerPosition } from '../types'

function PlayerPage() {
  const { userToken, sessionId } = useParams<string>()

  const [sessionInformation, setSessionInformation] = useState<SessionResult>()
  const [players, setPlayers] = useState<Player[]>([])
  const [waitlist, setWaitlist] = useState<WaitList[]>([])
  const [ myPlayerId, setMyPlayerId ] = useState<String>("");

  const [isLeaving, setIsLeaving] = useState(false)
  const [hasLeft, setHasLeft] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  const [showPositionPopup, setShowPositionPopup] = useState(false)
  const [positionError, setPositionError] = useState<string | null>(null)

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
    const myPlayerId: String = (await axios.get(`/api/players/token/${userToken}`)).data.data;
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

  const isLocked = sessionInformation?.state === 'locked'
  const isCompleted = sessionInformation?.state === 'completed'
  const isCancelled = sessionInformation?.state === 'cancelled'
  const isTeams = sessionInformation?.state === 'teams'
  const amOwedFor = players.some((player) => player.id === myPlayerId)
  const myPlayer = players.find((player) => player.id === myPlayerId)

  const handleSetPosition = async (primary: PlayerPosition, secondary: PlayerPosition) => {
    setPositionError(null)

    try {
      await axios.patch(`/api/players/positions/${sessionId}/${userToken}`, {
        primary_position: primary,
        secondary_position: secondary,
      })
      await fetchPlayers(sessionId)
      setShowPositionPopup(false)
    } catch {
      setPositionError('Something went wrong saving your position. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-neutral-50 to-neutral-50 px-6 py-20">
      <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-neutral-400">
        {sessionInformation?.player_count}/{sessionInformation?.capacity} players
        {isLocked && <StatusBadge tone="amber" label="Locked" />}
        {isCompleted && <StatusBadge tone="slate" label="Completed" />}
        {isTeams && <StatusBadge tone="emerald" label="Teams" />}
        {isCancelled && <StatusBadge tone="rose" label="Cancelled" />}
      </p>
      <h1 className="mt-2 text-center text-3xl font-semibold tracking-tight text-emerald-600">
        {sessionInformation?.court_name ?? `${sessionInformation?.host_name} session`}
      </h1>
      <p className="mt-3 text-neutral-500">
        {sessionInformation?.date} {sessionInformation?.time_start}–{sessionInformation?.time_end}
      </p>

      {isLocked && (
        <div className="mt-6 w-full max-w-md rounded-xl bg-amber-50 px-5 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Locked — payment collection open
          </p>
          {amOwedFor && sessionInformation?.price_per_player != null && (
            <p className="mt-1 text-sm font-medium text-amber-800">
              You owe: {formatCentsToDollars(sessionInformation.price_per_player)}
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="mt-6 w-full max-w-md rounded-xl bg-slate-100 px-5 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Session completed</p>
        </div>
      )}

      {isCancelled && (
        <div className="mt-6 w-full max-w-md rounded-xl bg-rose-50 px-5 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">This session has been cancelled</p>
        </div>
      )}

      {isTeams && (
        <div className="mt-6 w-full max-w-md rounded-xl bg-emerald-50 px-5 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Teams assigned</p>
        </div>
      )}

      <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Players in session
          </h2>
          <div className="space-y-3">
            {players.map((player) => (
              <PersonRow
                key={player.id}
                name={player.name}
                highlighted={player.id === myPlayerId}
                primaryPosition={player.primary_position}
                secondaryPosition={player.secondary_position}
              />
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
                <PersonRow
                  key={person.id}
                  name={person.name}
                  highlighted={person.id === myPlayerId}
                  primaryPosition={person.primary_position}
                  secondaryPosition={person.secondary_position}
                />
              ))
            ) : (
              <p className="text-sm text-neutral-400">No one's waiting right now.</p>
            )}
          </div>
        </div>
      </div>

      {myPlayerId && !isTeams && !hasLeft && (
        <div className="mt-16 flex w-full max-w-sm flex-col items-center gap-3">
          <button
            onClick={() => {
              playClickSound()
              setPositionError(null)
              setShowPositionPopup(true)
            }}
            className="w-full cursor-pointer rounded-xl border border-emerald-300 bg-white px-8 py-3 font-semibold text-emerald-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md active:translate-y-0 active:bg-emerald-100"
          >
            Choose Position
          </button>
        </div>
      )}

      {myPlayerId && !isCompleted && !isCancelled && (
        hasLeft ? (
          <p className="mt-16 text-center text-sm font-medium text-neutral-500">
            You've left the session.
          </p>
        ) : (
          <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-3">
            <button
              onClick={handleLeaveSession}
              disabled={isLeaving}
              className="w-full cursor-pointer rounded-xl bg-rose-500 px-8 py-3 font-semibold text-white shadow-md shadow-rose-500/25 transition-all duration-150 hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30 active:translate-y-0 active:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              {isLeaving ? 'Leaving…' : 'Leave Session'}
            </button>
            {leaveError && <p className="text-sm text-rose-500">{leaveError}</p>}
          </div>
        )
      )}

      {showPositionPopup && (
        <SetPositionPopup
          currentPrimary={myPlayer?.primary_position ?? null}
          currentSecondary={myPlayer?.secondary_position ?? null}
          error={positionError}
          onClose={() => setShowPositionPopup(false)}
          onSubmit={handleSetPosition}
        />
      )}
    </div>
  )
}

export default PlayerPage
