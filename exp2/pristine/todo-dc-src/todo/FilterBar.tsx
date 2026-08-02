import type { Filter } from './types.ts';

type Props = {
  current: Filter;
  onChange: (filter: Filter) => void;
};

const FILTERS: ReadonlyArray<{ value: Filter; testId: string; label: string }> = [
  { value: 'all', testId: 'filter-all', label: '전체' },
  { value: 'active', testId: 'filter-active', label: '미완료' },
  { value: 'completed', testId: 'filter-completed', label: '완료' },
];

/** U30: 선택 표시는 클래스명이 아니라 aria-pressed로 한다(클래스명은 계약상 자유). */
export function FilterBar({ current, onChange }: Props) {
  return (
    <div>
      {FILTERS.map((f) => (
        <button
          key={f.value}
          data-testid={f.testId}
          type="button"
          aria-pressed={f.value === current}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
