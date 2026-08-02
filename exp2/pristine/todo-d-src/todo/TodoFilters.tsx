import type { Filter } from "./types";

type TodoFiltersProps = {
  filter: Filter;
  onChange: (filter: Filter) => void;
};

const FILTER_BUTTONS: { value: Filter; testId: string; label: string }[] = [
  { value: "all", testId: "filter-all", label: "전체" },
  { value: "active", testId: "filter-active", label: "미완료" },
  { value: "completed", testId: "filter-completed", label: "완료" },
];

export default function TodoFilters({ filter, onChange }: TodoFiltersProps) {
  return (
    <div>
      {FILTER_BUTTONS.map((button) => (
        <button
          key={button.value}
          data-testid={button.testId}
          type="button"
          aria-pressed={filter === button.value}
          onClick={() => onChange(button.value)}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
