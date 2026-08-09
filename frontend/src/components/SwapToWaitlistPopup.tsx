import { playClickSound } from '../lib/sound'
import type { WaitList } from '../types'

function SwapToWaitlistPopup({
  playerName,
  waitlist,
  onClose,
  onSelect,
}: {
  playerName: string
  waitlist: WaitList[]
  onClose: () => void
  onSelect: (waitlistPlayer: WaitList) => void
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-neutral-900/30 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer text-xl leading-none text-neutral-400 hover:text-neutral-600"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-emerald-400">Swap out {playerName}?</h2>
        <p className="mt-1 text-sm text-neutral-500">Pick who from the waitlist takes their spot.</p>

        <div className="mt-6 space-y-2">
          {waitlist.length > 0 ? (
            waitlist.map((person) => (
              <button
                key={person.id}
                onClick={() => {
                  playClickSound()
                  onSelect(person)
                }}
                className="w-full cursor-pointer rounded-xl border border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50 active:bg-emerald-100"
              >
                {person.name}
              </button>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No one's on the waitlist to swap in.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SwapToWaitlistPopup
