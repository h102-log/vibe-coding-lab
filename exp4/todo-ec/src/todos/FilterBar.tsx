import type { Filter } from './model';

type Props = {
  filter: Filter;
  onChange: (filter: Filter) => void;
};

const FILTERS: ReadonlyArray<{ value: Filter; testid: string; label: string }> = [
  { value: 'all', testid: 'filter-all', label: '전체' },
  { value: 'active', testid: 'filter-active', label: '미완료' },
  { value: 'completed', testid: 'filter-completed', label: '완료' },
];

export default function FilterBar({ filter, onChange }: Props) {
  return (
    <nav>
      {FILTERS.map((item) => (
        <button
          key={item.value}
          data-testid={item.testid}
          type="button"
          // MISSING(선택된 필터의 시각적 표기): 스타일을 못 쓰므로 기계가 읽는 표시만 단다.
          aria-pressed={filter === item.value}
          // U27: 어떤 상태에서도 disabled로 만들지 않는다.
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
