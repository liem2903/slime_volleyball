import { useState } from 'react'
import { playClickSound } from '../lib/sound'
import type { PlayerPosition } from '../types'

const POSITION_OPTIONS: { value: PlayerPosition; label: string }[] = [
  { value: 'middle', label: 'Middle' },
  { value: 'oppo', label: 'Opposite' },
  { value: 'outside', label: 'Outside' },
  { value: 'lib', label: 'Libero' },
]

function SetPositionPopup({
  currentPrimary,
  currentSecondary,
  error,
  onClose,
  onSubmit,
}: {
  currentPrimary: PlayerPosition | null
  currentSecondary: PlayerPosition | null
  error: string | null
  onClose: () => void
  onSubmit: (primary: PlayerPosition, secondary: PlayerPosition) => void
}) {
  const [primary, setPrimary] = useState<PlayerPosition>(currentPrimary ?? 'middle')
  const [secondary, setSecondary] = useState<PlayerPosition>(currentSecondary ?? 'oppo')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = () => {
    if (primary === secondary) {
      setValidationError('Primary and secondary must be different.')
      return
    }
    setValidationError('')
    playClickSound()
    onSubmit(primary, secondary)
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

        <h2 className="text-lg font-semibold text-neutral-900">Choose your position</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Set a primary and secondary position preference for this session.
        </p>

        <div className="mt-6">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Primary position
          </label>
          <select
            value={primary}
            onChange={(e) => setPrimary(e.target.value as PlayerPosition)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
          >
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Secondary position
          </label>
          <select
            value={secondary}
            onChange={(e) => setSecondary(e.target.value as PlayerPosition)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
          >
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {validationError && <p className="mt-3 text-sm text-rose-400">{validationError}</p>}
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full cursor-pointer rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-amber-700 active:bg-amber-800"
        >
          Save position
        </button>
      </div>
    </div>
  )
}

export default SetPositionPopup
