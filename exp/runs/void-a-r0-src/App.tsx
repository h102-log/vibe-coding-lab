import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Filter, Todo } from "./todos";
import { loadTodos, nextId, saveTodos, visibleTodos } from "./todos";

const FILTERS: ReadonlyArray<{ key: Filter; testId: string; label: string }> = [
  { key: "all", testId: "filter-all", label: "전체" },
  { key: "active", testId: "filter-active", label: "미완료" },
  { key: "completed", testId: "filter-completed", label: "완료" },
];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (title === "") return;
    setTodos((prev) => [...prev, { id: nextId(prev), title, done: false }]);
    setDraft("");
  }

  function toggle(id: string) {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  const remaining = todos.filter((todo) => !todo.done).length;
  const shown = visibleTodos(todos, filter);

  return (
    <main>
      <h1>할 일</h1>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          aria-label="할 일 입력"
          placeholder="무엇을 해야 하나요?"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>

      <nav>
        {FILTERS.map(({ key, testId, label }) => (
          <button
            key={key}
            type="button"
            data-testid={testId}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <ul>
        {shown.map((todo) => (
          <li key={todo.id} data-testid="todo-item">
            <input
              data-testid="todo-toggle"
              type="checkbox"
              aria-label={`${todo.title} 완료 표시`}
              checked={todo.done}
              onChange={() => toggle(todo.id)}
            />
            <span data-testid="todo-title">{todo.title}</span>
            <button
              type="button"
              data-testid="todo-delete"
              aria-label={`${todo.title} 삭제`}
              onClick={() => remove(todo.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      <p data-testid="todo-count">{remaining}개 남음</p>
    </main>
  );
}
