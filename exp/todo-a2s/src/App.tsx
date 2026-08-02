import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todo-a2s:todos";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Todo[];
  } catch {
    return [];
  }
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const title = draft.trim();
    if (!title) return;
    setTodos((prev) => [...prev, { id: createId(), title, completed: false }]);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      addTodo();
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const activeCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  );

  return (
    <div>
      <h1>Todo</h1>
      <input
        data-testid="todo-input"
        type="text"
        value={draft}
        placeholder="할 일을 입력하세요"
        aria-label="새 할 일"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <ul>
        {visibleTodos.map((todo) => (
          <li key={todo.id} data-testid="todo-item">
            <input
              data-testid="todo-toggle"
              type="checkbox"
              checked={todo.completed}
              aria-label={`${todo.title} 완료 여부`}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              data-testid="todo-title"
              style={todo.completed ? { textDecoration: "line-through" } : undefined}
            >
              {todo.title}
            </span>
            <button data-testid="todo-delete" onClick={() => deleteTodo(todo.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>

      <div>
        <span data-testid="todo-count">{activeCount}</span>
      </div>

      <div>
        <button
          data-testid="filter-all"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
        >
          전체
        </button>
        <button
          data-testid="filter-active"
          onClick={() => setFilter("active")}
          aria-pressed={filter === "active"}
        >
          미완료
        </button>
        <button
          data-testid="filter-completed"
          onClick={() => setFilter("completed")}
          aria-pressed={filter === "completed"}
        >
          완료
        </button>
      </div>
    </div>
  );
}
