import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { playClickSound } from '../lib/sound'
import PersonRow from '../components/PersonRow'
import { convertDateToAbbreviation, convertTimeToMeredian } from '../helpers/sessionHelpers'
import type { Player, WaitList, SessionResult } from '../types'

function AdminPage() {
  const { sessionId, adminId } = useParams<string>()

  const [sessionInformation, setSessionInformation] = useState<SessionResult>()
  const [players, setPlayers] = useState<Player[]>([])
  const [waitlist, setWaitlist] = useState<WaitList[]>([])
  const [kickError, setKickError] = useState<string | null>(null)

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStarted, setPaymentStarted] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

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
    const waitList: WaitList[] = (await axios.get(`/api/players/waitlist/${sessionId}`)).data.data
    setWaitlist(waitList)
  }

  useEffect(() => {
    fetchSessionData(sessionId)
    fetchPlayers(sessionId)
    fetchWaitlist(sessionId)
  }, [sessionId])

  const handleKick = async (playerId: string) => {
    playClickSound()
    setKickError(null)

    try {
      await axios.delete(`/api/admin/${sessionId}/${adminId}/${playerId}/deletePlayer`);
      await Promise.all([fetchPlayers(sessionId), fetchWaitlist(sessionId)]);
    } catch {
      setKickError('Something went wrong removing that player. Please try again.')
    }
  }

  const handleMoveToPayment = async () => {
    playClickSound()
    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      // NOTE: not yet implemented server-side — proposed hook for changeSessionToPay.
      await axios.post(`/api/admin/${sessionId}/${adminId}/changeSessionState`)
      setPaymentStarted(true)
    } catch {
      setPaymentError('Something went wrong. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const pricePerPerson =
    sessionInformation && sessionInformation.player_count > 0
      ? `$${(sessionInformation.cost_cents / sessionInformation.player_count / 100).toFixed(2)} per person`
      : 'No confirmed players yet'

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
      <p className="mt-1 text-sm font-semibold text-emerald-600">{pricePerPerson}</p>

      <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Players in session
          </h2>
          <div className="space-y-3">
            {players.map((player) => (
              <PersonRow key={player.id} name={player.name} onRemove={() => handleKick(player.id)} />
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
                <PersonRow key={person.id} name={person.name} onRemove={() => handleKick(person.id)} />
              ))
            ) : (
              <p className="text-sm text-neutral-400">No one's waiting right now.</p>
            )}
          </div>
        </div>
      </div>

      {kickError && <p className="mt-6 text-sm text-rose-500">{kickError}</p>}

      {paymentStarted ? (
        <p className="mt-16 text-center text-sm font-medium text-neutral-500">
          Session moved to payment.
        </p>
      ) : (
        <div className="mt-16 flex w-full max-w-sm flex-col items-center gap-3">
          <button
            onClick={handleMoveToPayment}
            disabled={isProcessingPayment}
            className="w-full cursor-pointer rounded-full bg-amber-200 px-8 py-4 font-semibold text-neutral-800 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-amber-300 hover:shadow-md active:scale-95 active:bg-amber-400 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {isProcessingPayment ? 'Moving to Payment…' : 'Move to Payment'}
          </button>
          {paymentError && <p className="text-sm text-rose-500">{paymentError}</p>}
        </div>
      )}
    </div>
  )
}

export default AdminPage
