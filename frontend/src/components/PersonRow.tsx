import StatusBadge from './StatusBadge'
import PositionBadge from './PositionBadge'
import type { PlayerPosition } from '../types'

function PersonRow({
  name,
  highlighted = false,
  state,
  primaryPosition,
  secondaryPosition,
  onRemove,
  onPromote,
  onConfirmPayment,
}: {
  name: string
  highlighted?: boolean
  state?: 'interested' | 'waitlist' | 'payment_pending' | 'confirmed'
  primaryPosition?: PlayerPosition | null
  secondaryPosition?: PlayerPosition | null
  onRemove?: () => void
  onPromote?: () => void
  onConfirmPayment?: () => void
}) {
  return (
    <div
      className={`group flex items-center justify-between gap-2 rounded-2xl border px-5 py-3 shadow-sm ${
        highlighted
          ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <p className={`flex items-center gap-2 text-sm font-medium ${highlighted ? 'text-emerald-700' : 'text-neutral-700'}`}>
        {name}
        {highlighted && <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">You</span>}
        {state === 'payment_pending' && <StatusBadge tone="amber" label="Pending" />}
        {state === 'confirmed' && <StatusBadge tone="emerald" label="Paid" />}
        {primaryPosition && <PositionBadge position={primaryPosition} emphasis="primary" />}
        {secondaryPosition && <PositionBadge position={secondaryPosition} emphasis="secondary" />}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        {onConfirmPayment && (
          <button
            onClick={onConfirmPayment}
            title="Mark as paid"
            className="shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-300 transition-all duration-150 hover:scale-110 hover:bg-emerald-100 hover:text-emerald-600 active:scale-95 active:bg-emerald-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {onPromote && (
          <button
            onClick={onPromote}
            title="Swap to waitlist"
            className="shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-300 transition-all duration-150 hover:scale-110 hover:bg-amber-100 hover:text-amber-600 active:scale-95 active:bg-amber-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M8.75 3.75a.75.75 0 00-1.5 0v10.638L5.03 12.15a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l3.5-3.5a.75.75 0 10-1.06-1.06l-2.22 2.22V3.75zM17 6.31l2.22 2.22a.75.75 0 101.06-1.06l-3.5-3.5a.75.75 0 00-1.06 0l-3.5 3.5a.75.75 0 101.06 1.06L15.25 6.31v10.66a.75.75 0 001.5 0V6.31z" />
            </svg>
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            title="Remove player"
            className="shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-300 transition-all duration-150 hover:scale-110 hover:bg-rose-100 hover:text-rose-600 active:scale-95 active:bg-rose-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default PersonRow
