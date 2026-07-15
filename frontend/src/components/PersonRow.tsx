function PersonRow({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 shadow-sm">
      <p className="text-sm font-medium text-neutral-700">{name}</p>
    </div>
  )
}

export default PersonRow
