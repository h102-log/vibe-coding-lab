import type { Filter } from "./types";

type Props = {
  current: Filter;
  onChange: (filter: Filter) => void;
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "미완료" },
  { value: "completed", label: "완료" },
];

export default function FilterBar({ current, onChange }: Props) {
  return (
    <div>
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          data-testid={`filter-${value}`}
          type="button"
          aria-pressed={value === current}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
