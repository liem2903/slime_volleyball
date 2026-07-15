function LinkRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-neutral-700">{value}</p>
    </div>
  )
}

export default LinkRow
