import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { playClickSound } from '../lib/sound'
import PersonRow from '../components/PersonRow'
import StatusBadge from '../components/StatusBadge'
import SwapToWaitlistPopup from '../components/SwapToWaitlistPopup'
import ChangeCapacityPopup from '../components/ChangeCapacityPopup'
import TriggerTeamsModePopup from '../components/TriggerTeamsModePopup'
import { convertDateToAbbreviation, convertTimeToMeredian, formatCentsToDollars } from '../helpers/sessionHelpers'
import type { Player, WaitList, SessionResult } from '../types'

function AdminPage() {
  const { sessionId, adminId } = useParams<string>()

  const [sessionInformation, setSessionInformation] = useState<SessionResult>()
  const [players, setPlayers] = useState<Player[]>([])
  const [waitlist, setWaitlist] = useState<WaitList[]>([])
  const [kickError, setKickError] = useState<string | null>(null)
  const [swapCandidate, setSwapCandidate] = useState<Player | null>(null)
  const [swapError, setSwapError] = useState<string | null>(null)

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const [showCapacityPopup, setShowCapacityPopup] = useState(false)
  const [capacityError, setCapacityError] = useState<string | null>(null)

  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const [showTeamsPopup, setShowTeamsPopup] = useState(false)
  const [teamsError, setTeamsError] = useState<string | null>(null)

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

  const handleSwap = async (waitlistPlayer: WaitList) => {
    if (!swapCandidate) return

    playClickSound()
    setSwapError(null)

    try {
      await axios.patch(`/api/admin/${sessionId}/${adminId}/${waitlistPlayer.id}/${swapCandidate.id}/swapStates`)
      await Promise.all([fetchPlayers(sessionId), fetchWaitlist(sessionId)])
      setSwapCandidate(null)
    } catch {
      setSwapError('Something went wrong swapping that player. Please try again.')
    }
  }

  const handleMoveToPayment = async () => {
    playClickSound()
    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      await axios.patch(`/api/admin/${sessionId}/${adminId}/lockSession`, { state: 'locked' })
      await Promise.all([fetchSessionData(sessionId), fetchPlayers(sessionId), fetchWaitlist(sessionId)])
    } catch {
      setPaymentError('Something went wrong. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleUnlock = async () => {
    playClickSound()
    setIsUnlocking(true)
    setUnlockError(null)

    try {
      await axios.patch(`/api/admin/${sessionId}/${adminId}/unlockSession`)
      await Promise.all([fetchSessionData(sessionId), fetchPlayers(sessionId), fetchWaitlist(sessionId)])
    } catch {
      setUnlockError('Something went wrong unlocking the session. Please try again.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleConfirmPayment = async (playerId: string) => {
    playClickSound()
    setConfirmError(null)

    try {
      await axios.patch(`/api/admin/${sessionId}/${adminId}/${playerId}/confirm`)
      await Promise.all([fetchSessionData(sessionId), fetchPlayers(sessionId), fetchWaitlist(sessionId)])
    } catch {
      setConfirmError('Something went wrong marking that player as paid. Please try again.')
    }
  }

  const handleChangeCapacity = async (newCapacity: number) => {
    setCapacityError(null)

    try {
      await axios.patch(`/api/admin/${sessionId}/${adminId}/changeCapacity`, { capacity: newCapacity })
      await Promise.all([fetchSessionData(sessionId), fetchPlayers(sessionId), fetchWaitlist(sessionId)])
      setShowCapacityPopup(false)
    } catch {
      setCapacityError('Something went wrong changing the capacity. Please try again.')
    }
  }

  const isLocked = sessionInformation?.state === 'locked'
  const isCompleted = sessionInformation?.state === 'completed'
  const isCancelled = sessionInformation?.state === 'cancelled'
  const isTeams = sessionInformation?.state === 'teams'
  const isOver = isCompleted || isCancelled
  const hasConfirmedPlayer = players.some((player) => player.state === 'confirmed')

  const handleMoveToTeams = async (teams: { name: string; color?: string }[]) => {
    setTeamsError(null)

    try {
      await axios.patch(`/api/admin/${sessionId}/${adminId}/moveToTeams`, { teams })
      await Promise.all([fetchSessionData(sessionId), fetchPlayers(sessionId), fetchWaitlist(sessionId)])
      setShowTeamsPopup(false)
    } catch {
      setTeamsError('Something went wrong starting teams mode. Please try again.')
    }
  }

  const pricePerPerson =
    isLocked && sessionInformation?.price_per_player != null
      ? `${formatCentsToDollars(sessionInformation.price_per_player)} per person`
      : sessionInformation && sessionInformation.player_count > 0
        ? `$${(sessionInformation.cost_cents / sessionInformation.player_count / 100).toFixed(2)} per person`
        : 'No confirmed players yet'

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-neutral-50 to-neutral-50 px-6 py-20">
      <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-neutral-400">
        {sessionInformation?.player_count}/{sessionInformation?.capacity} players
        {isLocked && <StatusBadge tone="amber" label="Locked" />}
        {isCompleted && <StatusBadge tone="slate" label="Completed" />}
        {isTeams && <StatusBadge tone="emerald" label="Teams" />}
        {isCancelled && <StatusBadge tone="rose" label="Cancelled" />}
        {sessionInformation?.state === 'unlocked' && (
          <button
            onClick={() => {
              playClickSound()
              setCapacityError(null)
              setShowCapacityPopup(true)
            }}
            className="cursor-pointer rounded-md border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-neutral-500 transition-colors duration-150 hover:border-emerald-300 hover:text-emerald-600"
          >
            Edit capacity
          </button>
        )}
      </p>
      <h1 className="mt-2 text-center text-3xl font-semibold tracking-tight text-emerald-600">
        {sessionInformation?.court_name ?? `${sessionInformation?.host_name} session`}
      </h1>
      <p className="mt-3 text-neutral-500">
        {sessionInformation?.date} {sessionInformation?.time_start}–{sessionInformation?.time_end}
      </p>
      <p className="mt-1 text-sm font-semibold text-emerald-700">{pricePerPerson}</p>

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
                onRemove={!isOver ? () => handleKick(player.id) : undefined}
                onPromote={sessionInformation?.state === 'unlocked' ? () => setSwapCandidate(player) : undefined}
                onConfirmPayment={
                  !isOver && player.state === 'payment_pending' ? () => handleConfirmPayment(player.id) : undefined
                }
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
                  onRemove={!isOver ? () => handleKick(person.id) : undefined}
                />
              ))
            ) : (
              <p className="text-sm text-neutral-400">No one's waiting right now.</p>
            )}
          </div>
        </div>
      </div>

      {kickError && <p className="mt-6 text-sm text-rose-500">{kickError}</p>}
      {swapError && <p className="mt-6 text-sm text-rose-500">{swapError}</p>}
      {confirmError && <p className="mt-6 text-sm text-rose-500">{confirmError}</p>}

      {isOver ? (
        <>
          <div
            className={`mt-16 w-full max-w-md rounded-xl px-5 py-3 text-center ${
              isCompleted ? 'bg-slate-100' : 'bg-rose-50'
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isCompleted ? 'text-slate-700' : 'text-rose-700'
              }`}
            >
              {isCompleted ? 'Session completed' : 'This session has been cancelled'}
            </p>
          </div>
          {isCompleted && (
            <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-3">
              <button
                onClick={() => {
                  playClickSound()
                  setTeamsError(null)
                  setShowTeamsPopup(true)
                }}
                className="w-full cursor-pointer rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-150 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:translate-y-0 active:bg-emerald-800"
              >
                Trigger Teams Mode
              </button>
            </div>
          )}
        </>
      ) : isTeams ? (
        <div className="mt-16 w-full max-w-md rounded-xl bg-emerald-50 px-5 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Teams assigned</p>
        </div>
      ) : isLocked ? (
        hasConfirmedPlayer ? (
          <div className="mt-16 w-full max-w-md rounded-xl bg-amber-50 px-5 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Locked — payment collection open
            </p>
          </div>
        ) : (
          <div className="mt-16 flex w-full max-w-sm flex-col items-center gap-3">
            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full cursor-pointer rounded-xl border border-amber-300 bg-white px-8 py-3 font-semibold text-amber-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 hover:shadow-md active:translate-y-0 active:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {isUnlocking ? 'Unlocking…' : 'Unlock session'}
            </button>
            {unlockError && <p className="text-sm text-rose-500">{unlockError}</p>}
          </div>
        )
      ) : (
        <div className="mt-16 flex w-full max-w-sm flex-col items-center gap-3">
          <button
            onClick={handleMoveToPayment}
            disabled={isProcessingPayment}
            className="w-full cursor-pointer rounded-xl bg-amber-500 px-8 py-3 font-semibold text-white shadow-md shadow-amber-500/25 transition-all duration-150 hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 active:translate-y-0 active:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md"
          >
            {isProcessingPayment ? 'Moving to Payment…' : 'Move to Payment'}
          </button>
          {paymentError && <p className="text-sm text-rose-500">{paymentError}</p>}
        </div>
      )}

      {swapCandidate && (
        <SwapToWaitlistPopup
          playerName={swapCandidate.name}
          waitlist={waitlist}
          onClose={() => setSwapCandidate(null)}
          onSelect={handleSwap}
        />
      )}

      {showCapacityPopup && sessionInformation && (
        <ChangeCapacityPopup
          currentCapacity={sessionInformation.capacity}
          playerCount={sessionInformation.player_count}
          error={capacityError}
          onClose={() => setShowCapacityPopup(false)}
          onSubmit={handleChangeCapacity}
        />
      )}

      {showTeamsPopup && (
        <TriggerTeamsModePopup
          error={teamsError}
          onClose={() => setShowTeamsPopup(false)}
          onSubmit={handleMoveToTeams}
        />
      )}
    </div>
  )
}

export default AdminPage
