import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { Filter, Todo } from "./todos";
import {
  allDone,
  createTodo,
  loadTodos,
  remainingCount,
  saveTodos,
  searchTodos,
  setAllDone,
  visibleTodos,
  withoutCompleted,
} from "./todos";

const FILTERS: { key: Filter; testId: string; label: string }[] = [
  { key: "all", testId: "filter-all", label: "전체" },
  { key: "active", testId: "filter-active", label: "미완료" },
  { key: "completed", testId: "filter-completed", label: "완료" },
];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // 필터와 검색은 함께 걸린다 (교집합).
  const shown = useMemo(
    () => searchTodos(visibleTodos(todos, filter), query),
    [todos, filter, query],
  );
  const remaining = remainingCount(todos);
  const everythingDone = allDone(todos);

  function addTodo() {
    const title = draft.trim();
    setDraft("");
    if (title.length === 0) return;
    setTodos((prev) => [...prev, createTodo(title)]);
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos(withoutCompleted);
  }

  function startEditing(event: MouseEvent<HTMLLIElement>, todo: Todo) {
    // 제목을 겨냥한 더블클릭만 편집으로 친다. 체크박스·삭제 버튼 위에서는 무시한다.
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, button") !== null) return;
    setEditingId(todo.id);
    setEditDraft(todo.title);
  }

  function commitEdit(id: string) {
    const title = editDraft.trim();
    // 빈 제목은 추가 때와 같은 규칙으로 거부한다 — 원래 제목을 그대로 둔다.
    if (title.length > 0) {
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? { ...todo, title } : todo)),
      );
    }
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function onEditKeyDown(event: KeyboardEvent<HTMLInputElement>, id: string) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
      return;
    }
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    commitEdit(id);
  }

  function toggleAll() {
    // 다음 상태는 최신 목록에서 다시 판정한다 — 렌더 시점의 allEverythingDone에 기대지 않는다.
    setTodos((prev) => setAllDone(prev, !allDone(prev)));
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    // 폼 암묵 제출까지 막아, Enter 한 번에 한 개만 추가되게 한다.
    event.preventDefault();
    addTodo();
  }

  return (
    <main>
      <h1>할 일</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          addTodo();
        }}
      >
        <input
          data-testid="todo-input"
          aria-label="할 일 입력"
          placeholder="할 일을 입력하고 Enter"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onInputKeyDown}
        />
      </form>

      {/* 추가 폼 바깥에 둔다 — 검색창에서 Enter를 눌러도 항목이 추가되지 않도록. */}
      <input
        type="search"
        data-testid="search-input"
        aria-label="제목 검색"
        placeholder="제목 검색"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <p data-testid="todo-count">{remaining}개 남음</p>

      <nav>
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            data-testid={option.testId}
            aria-pressed={filter === option.key}
            onClick={() => setFilter(option.key)}
          >
            {option.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        data-testid="clear-completed"
        aria-label="완료된 항목 모두 삭제"
        onClick={clearCompleted}
      >
        완료된 항목 삭제
      </button>

      <input
        type="checkbox"
        data-testid="toggle-all"
        aria-label="모든 항목 완료 표시"
        checked={everythingDone}
        onChange={toggleAll}
      />

      <ul>
        {shown.map((todo) => (
          <li
            key={todo.id}
            data-testid="todo-item"
            onDoubleClick={(event) => startEditing(event, todo)}
          >
            <input
              type="checkbox"
              data-testid="todo-toggle"
              aria-label={`${todo.title} 완료`}
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span data-testid="todo-title">{todo.title}</span>
            {editingId === todo.id && (
              <input
                data-testid="todo-edit"
                aria-label={`${todo.title} 제목 편집`}
                autoFocus
                value={editDraft}
                onChange={(event) => setEditDraft(event.target.value)}
                onKeyDown={(event) => onEditKeyDown(event, todo.id)}
                onBlur={() => commitEdit(todo.id)}
              />
            )}
            <button
              type="button"
              data-testid="todo-delete"
              aria-label={`${todo.title} 삭제`}
              onClick={() => deleteTodo(todo.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
