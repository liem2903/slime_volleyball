import { useState } from 'react'
import { playClickSound } from '../lib/sound'

function ChangeCapacityPopup({
  currentCapacity,
  playerCount,
  error,
  onClose,
  onSubmit,
}: {
  currentCapacity: number
  playerCount: number
  error: string | null
  onClose: () => void
  onSubmit: (capacity: number) => void
}) {
  const [capacity, setCapacity] = useState(String(currentCapacity))
  const [validationError, setValidationError] = useState('')

  const parsedCapacity = Number(capacity)
  const isValid = capacity.trim() !== '' && Number.isInteger(parsedCapacity) && parsedCapacity > 0

  const handleSubmit = () => {
    if (!isValid) {
      setValidationError('Enter a valid capacity.')
      return
    }
    setValidationError('')
    playClickSound()
    onSubmit(parsedCapacity)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-neutral-900/30 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer text-xl leading-none text-neutral-400 hover:text-neutral-600"
        >
          &times;
        </button>

        <h2 className="text-lg font-semibold text-neutral-900">Change capacity</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Currently {playerCount}/{currentCapacity} players.
        </p>

        <div className="mt-6">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            New capacity
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

        {isValid && parsedCapacity < playerCount && (
          <p className="mt-3 text-sm text-amber-600">
            This will waitlist the {playerCount - parsedCapacity} most recently joined player
            {playerCount - parsedCapacity === 1 ? '' : 's'}.
          </p>
        )}
        {isValid && parsedCapacity > currentCapacity && (
          <p className="mt-3 text-sm text-emerald-600">
            This will promote the earliest waitlisted players, if there's room.
          </p>
        )}

        {validationError && <p className="mt-3 text-sm text-rose-400">{validationError}</p>}
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full cursor-pointer rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-amber-700 active:bg-amber-800"
        >
          Save capacity
        </button>
      </div>
    </div>
  )
}

export default ChangeCapacityPopup
