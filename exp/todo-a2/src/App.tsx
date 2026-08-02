import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { loadTodos, saveTodos } from "./todoStorage";
import type { Todo } from "./todoStorage";

type Filter = "all" | "active" | "completed";

let seq = 0;
function nextId() {
  seq += 1;
  return `todo-${Date.now().toString(36)}-${seq}`;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const visible = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const remaining = todos.filter((t) => !t.completed).length;

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (title === "") return;
    setTodos((prev) => [...prev, { id: nextId(), title, completed: false }]);
    setDraft("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <h1>Todo</h1>

      <form onSubmit={addTodo}>
        <input
          data-testid="todo-input"
          aria-label="할 일 입력"
          value={draft}
          placeholder="할 일을 입력하세요"
          onChange={(e) => setDraft(e.target.value)}
        />
      </form>

      <ul>
        {visible.map((todo) => (
          <li key={todo.id} data-testid="todo-item">
            <input
              type="checkbox"
              data-testid="todo-toggle"
              aria-label={`${todo.title} 완료 표시`}
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span data-testid="todo-title">{todo.title}</span>
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

      <div>
        <span data-testid="todo-count">{remaining}</span>
      </div>

      <div>
        <button
          type="button"
          data-testid="filter-all"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          전체
        </button>
        <button
          type="button"
          data-testid="filter-active"
          aria-pressed={filter === "active"}
          onClick={() => setFilter("active")}
        >
          미완료
        </button>
        <button
          type="button"
          data-testid="filter-completed"
          aria-pressed={filter === "completed"}
          onClick={() => setFilter("completed")}
        >
          완료
        </button>
      </div>
    </div>
  );
}
