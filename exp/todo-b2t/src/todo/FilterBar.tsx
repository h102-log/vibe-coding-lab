import type { Filter } from './types';

const FILTERS: ReadonlyArray<{ value: Filter; testId: string; label: string }> = [
  { value: 'all', testId: 'filter-all', label: '전체' },
  { value: 'active', testId: 'filter-active', label: '미완료' },
  { value: 'completed', testId: 'filter-completed', label: '완료' },
];

type Props = {
  filter: Filter;
  onChange: (filter: Filter) => void;
};

export default function FilterBar({ filter, onChange }: Props) {
  return (
    <div>
      {FILTERS.map((entry) => (
        <button
          key={entry.value}
          type="button"
          data-testid={entry.testId}
          aria-pressed={filter === entry.value}
          onClick={() => onChange(entry.value)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}
