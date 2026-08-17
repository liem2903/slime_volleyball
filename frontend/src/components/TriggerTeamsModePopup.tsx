import { useState } from 'react'
import { playClickSound } from '../lib/sound'

type TeamRow = { name: string; color: string }

function TriggerTeamsModePopup({
  error,
  onClose,
  onSubmit,
}: {
  error: string | null
  onClose: () => void
  onSubmit: (teams: { name: string; color?: string }[]) => void
}) {
  const [rows, setRows] = useState<TeamRow[]>([
    { name: '', color: '' },
    { name: '', color: '' },
  ])
  const [validationError, setValidationError] = useState('')

  const updateRow = (index: number, field: keyof TeamRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addRow = () => {
    setRows((prev) => [...prev, { name: '', color: '' }])
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const teams = rows
      .map((row) => ({ name: row.name.trim(), color: row.color.trim() }))
      .filter((row) => row.name !== '')

    if (teams.length === 0) {
      setValidationError('Add at least one team.')
      return
    }

    setValidationError('')
    playClickSound()
    onSubmit(teams.map((team) => ({ name: team.name, color: team.color || undefined })))
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

        <h2 className="text-lg font-semibold text-neutral-900">Trigger teams mode</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Define the teams for this session. You can add or remove rows below.
        </p>

        <div className="mt-6 space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => updateRow(index, 'name', e.target.value)}
                  placeholder={`Team ${index + 1} name`}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
                />
                <input
                  type="text"
                  value={row.color}
                  onChange={(e) => updateRow(index, 'color', e.target.value)}
                  placeholder="Color (optional)"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(index)}
                  aria-label="Remove team"
                  className="mt-1 shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-300 transition-all duration-150 hover:bg-rose-100 hover:text-rose-600"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-3 cursor-pointer text-xs font-semibold uppercase tracking-wide text-emerald-600 hover:text-emerald-700"
        >
          + Add team
        </button>

        {validationError && <p className="mt-3 text-sm text-rose-400">{validationError}</p>}
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full cursor-pointer rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-amber-700 active:bg-amber-800"
        >
          Start Teams Mode
        </button>
      </div>
    </div>
  )
}

export default TriggerTeamsModePopup
