function PersonRow({ name, highlighted = false }: { name: string; highlighted?: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-5 py-3 shadow-sm ${
        highlighted
          ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <p className={`text-sm font-medium ${highlighted ? 'text-emerald-700' : 'text-neutral-700'}`}>
        {name}
        {highlighted && <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-emerald-500">You</span>}
      </p>
    </div>
  )
}

export default PersonRow
