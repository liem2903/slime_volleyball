import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { playClickSound } from '../lib/sound'
import PersonRow from '../components/PersonRow'
import StatusBadge from '../components/StatusBadge'
import JoinSessionPopup from '../components/JoinSessionPopup'
import LinkRow from '../components/LinkRow'
import { convertDateToAbbreviation, convertTimeToMeredian } from '../helpers/sessionHelpers';
import type { WaitList, Player, SessionResult, PlayerResponse } from '../types'
import axios from 'axios'

function SessionPage() {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [playerLink, setPlayerLink] = useState<string | null>(null)
  // Placeholder join flow (no backend yet) — swap for real state once players come from the API.
  const [ sessionInformation, setSessionInformation ] = useState<SessionResult>();
  const [ players, setPlayers ] = useState<Player[]>([]);
  const [ waitlist, setWaitlist ] = useState<WaitList[]>([]);
  const { sessionId } = useParams<string>();

  useEffect(() => {
    const fetchSessionData = async (sessionId: string | undefined) => {            
      let sessionInfo: SessionResult = (await axios.get(`/api/session/${sessionId}`)).data.data;

      let new_session_info: SessionResult = {...sessionInfo, date: convertDateToAbbreviation(sessionInfo.date), time_start: convertTimeToMeredian(sessionInfo.time_start), time_end: convertTimeToMeredian(sessionInfo.time_end)}
      setSessionInformation(new_session_info);
    }

    const fetchPlayers = async(sessionId: string | undefined) => {
      let players: Player[] = (await axios.get(`/api/players/${sessionId}`)).data.data;
      setPlayers(players);
    }

    const fetchWaitlist = async(sessionId: string | undefined) => {
      let waitList: WaitList[] = (await axios.get(`/api/players/waitlist/${sessionId}`)).data.data;
      setWaitlist(waitList);
    }

    fetchSessionData(sessionId);
    fetchPlayers(sessionId);
    fetchWaitlist(sessionId);
  }, [])

  const isLocked = sessionInformation?.state === 'locked'
  const isCompleted = sessionInformation?.state === 'completed'
  const isCancelled = sessionInformation?.state === 'cancelled'
  const isTeams = sessionInformation?.state === 'teams'
  const isOver = isCompleted || isCancelled

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
                state={player.state}
                primaryPosition={player.primary_position}
                secondaryPosition={player.secondary_position}
                assignedPosition={player.assigned_position}
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
                  primaryPosition={person.primary_position}
                  secondaryPosition={person.secondary_position}
                  assignedPosition={person.assigned_position}
                />
              ))
            ) : (
              <p className="text-sm text-neutral-400">No one's waiting right now.</p>
            )}
          </div>
        </div>
      </div>

      {playerLink ? (
        <div className="mt-16 w-full max-w-sm">
          <LinkRow label="Your link" value={playerLink} />
        </div>
      ) : isOver ? (
        <div
          className={`mt-16 w-full max-w-md rounded-xl px-5 py-3 text-center ${
            isCompleted ? 'bg-slate-100' : 'bg-rose-50'
          }`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              isCompleted ? 'text-slate-600' : 'text-rose-600'
            }`}
          >
            {isCompleted ? 'This session has ended.' : 'This session has been cancelled.'}
          </p>
        </div>
      ) : isTeams ? (
        <div className="mt-16 w-full max-w-md rounded-xl bg-emerald-50 px-5 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Teams assigned</p>
        </div>
      ) : (
        <div className="mt-16 flex w-full max-w-sm flex-col items-center gap-3">
          <button
            onClick={() => {
              playClickSound()
              setIsPopupOpen(true)
            }}
            className="w-full cursor-pointer rounded-xl bg-amber-500 px-8 py-3 font-semibold text-white shadow-md shadow-amber-500/25 transition-all duration-150 hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 active:translate-y-0 active:bg-amber-700"
          >
            Join Session
          </button>
          {isLocked && (
            <p className="text-center text-xs font-medium text-amber-600">
              Payment collection is underway — new joins go to the waitlist.
            </p>
          )}
        </div>
      )}

      {isPopupOpen && (
        <JoinSessionPopup
          onClose={() => setIsPopupOpen(false)}
          onSubmit={async (email, name) => {
            const player: PlayerResponse = (await axios.post('/api/players/create', {email, name, session_id: sessionId})).data.data;
            if (player.user_state === 'waitlist') {
              setWaitlist((prev) => [...prev, { id: player.id, name: player.name, state: player.user_state }]);
            } else {
              setPlayers((prev) => [...prev, { id: player.id, name: player.name, state: player.user_state }]);
            }
            setPlayerLink(player.user_link);
            setIsPopupOpen(false);
          }}
        />
      )}
    </div>
  )
}

export default SessionPage
