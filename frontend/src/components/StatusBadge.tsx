const toneClasses = {
  amber: 'bg-amber-100 text-amber-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  rose: 'bg-rose-100 text-rose-800',
  slate: 'bg-slate-100 text-slate-700',
}

function StatusBadge({
  tone,
  label,
}: {
  tone: 'amber' | 'emerald' | 'rose' | 'slate'
  label: string
}) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
