import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { playClickSound } from '../lib/sound'
import PersonRow from '../components/PersonRow'
import JoinSessionPopup from '../components/JoinSessionPopup'
import SwapToWaitlistPopup from '../components/SwapToWaitlistPopup'
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
  const [ swapCandidate, setSwapCandidate ] = useState<Player | null>(null);
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
              <PersonRow
                key={player.id}
                name={player.name}
                onPromote={() => setSwapCandidate(player)}
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
              waitlist.map((person) => <PersonRow key={person.id} name={person.name} />)
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
      ) : (
        <button
          onClick={() => {
            playClickSound()
            setIsPopupOpen(true)
          }}
          className="mt-16 w-full max-w-sm cursor-pointer rounded-full bg-amber-200 px-8 py-4 font-semibold text-neutral-800 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-amber-300 hover:shadow-md active:scale-95 active:bg-amber-400 active:shadow-sm"
        >
          Join Session
        </button>
      )}

      {isPopupOpen && (
        <JoinSessionPopup
          onClose={() => setIsPopupOpen(false)}
          onSubmit={async (email, name) => {
            const player: PlayerResponse = (await axios.post('/api/players/create', {email, name, session_id: sessionId})).data.data;
            if (player.user_state === 'waitlist') {
              setWaitlist((prev) => [...prev, { id: player.id, name: player.name }]);
            } else {
              setPlayers((prev) => [...prev, { id: player.id, name: player.name }]);
            }
            setPlayerLink(player.user_link);
            setIsPopupOpen(false);
          }}
        />
      )}

      {swapCandidate && (
        <SwapToWaitlistPopup
          playerName={swapCandidate.name}
          waitlist={waitlist}
          onClose={() => setSwapCandidate(null)}
          onSelect={(waitlistPlayer) => {
            setPlayers((prev) => [
              ...prev.filter((p) => p.id !== swapCandidate.id),
              { id: waitlistPlayer.id, name: waitlistPlayer.name },
            ]);
            setWaitlist((prev) => [
              ...prev.filter((p) => p.id !== waitlistPlayer.id),
              { id: swapCandidate.id, name: swapCandidate.name },
            ]);
            setSwapCandidate(null);
          }}
        />
      )}
    </div>
  )
}

export default SessionPage
