import type { Filter } from './types.ts'

type FilterBarProps = {
  filter: Filter
  onChange: (filter: Filter) => void
}

const FILTERS: { value: Filter; testId: string; label: string }[] = [
  { value: 'all', testId: 'filter-all', label: '전체' },
  { value: 'active', testId: 'filter-active', label: '미완료' },
  { value: 'completed', testId: 'filter-completed', label: '완료' },
]

export default function FilterBar({ filter, onChange }: FilterBarProps) {
  return (
    <nav>
      {FILTERS.map(({ value, testId, label }) => (
        <button
          key={value}
          data-testid={testId}
          type="button"
          aria-pressed={filter === value}
          data-selected={filter === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
