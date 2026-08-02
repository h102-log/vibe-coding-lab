import type { Filter } from './types';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '미완료' },
  { key: 'completed', label: '완료' },
];

type Props = {
  filter: Filter;
  onChange: (filter: Filter) => void;
};

export default function FilterBar({ filter, onChange }: Props) {
  return (
    <div>
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          data-testid={`filter-${key}`}
          aria-pressed={filter === key}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
