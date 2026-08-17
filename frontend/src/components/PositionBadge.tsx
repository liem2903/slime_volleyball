import type { PlayerPosition } from '../types'

const POSITION_META: Record<PlayerPosition, { label: string; name: string; solid: string; outline: string }> = {
  middle: {
    label: 'MID',
    name: 'Middle',
    solid: 'bg-violet-100 text-violet-700',
    outline: 'border border-violet-200 bg-white text-violet-600',
  },
  oppo: {
    label: 'OPP',
    name: 'Opposite',
    solid: 'bg-sky-100 text-sky-700',
    outline: 'border border-sky-200 bg-white text-sky-600',
  },
  outside: {
    label: 'OH',
    name: 'Outside',
    solid: 'bg-fuchsia-100 text-fuchsia-700',
    outline: 'border border-fuchsia-200 bg-white text-fuchsia-600',
  },
  lib: {
    label: 'LIB',
    name: 'Libero',
    solid: 'bg-teal-100 text-teal-700',
    outline: 'border border-teal-200 bg-white text-teal-600',
  },
}

function PositionBadge({
  position,
  emphasis,
}: {
  position: PlayerPosition
  emphasis: 'primary' | 'secondary'
}) {
  const meta = POSITION_META[position]

  return (
    <span
      title={`${emphasis === 'primary' ? 'Primary' : 'Secondary'} position: ${meta.name}`}
      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        emphasis === 'primary' ? meta.solid : meta.outline
      }`}
    >
      {meta.label}
    </span>
  )
}

export default PositionBadge
