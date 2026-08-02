import { useEffect, useMemo, useRef, useState } from "react";
import type { Filter, Todo } from "./types";
import { loadTodos, saveTodos } from "./storage";

let nextId = 0;
function generateId(): string {
  nextId += 1;
  return `${Date.now()}-${nextId}`;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [filter, setFilter] = useState<Filter>("all");
  const [inputValue, setInputValue] = useState("");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveTodos(todos);
  }, [todos]);

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.done).length,
    [todos],
  );

  const visibleTodos = useMemo(() => {
    if (filter === "active") return todos.filter((todo) => !todo.done);
    if (filter === "completed") return todos.filter((todo) => todo.done);
    return todos;
  }, [todos, filter]);

  function handleAdd() {
    const title = inputValue.trim();
    if (title.length === 0) {
      setInputValue("");
      return;
    }
    setTodos((prev) => [...prev, { id: generateId(), title, done: false }]);
    setInputValue("");
  }

  function handleToggle(id: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    );
  }

  function handleDelete(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  return (
    <div>
      <h1>Todo</h1>
      <input
        data-testid="todo-input"
        type="text"
        aria-label="새 할 일"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <ul>
        {visibleTodos.map((todo) => (
          <li data-testid="todo-item" key={todo.id}>
            <input
              data-testid="todo-toggle"
              type="checkbox"
              aria-label={`${todo.title} 완료 여부`}
              checked={todo.done}
              onChange={() => handleToggle(todo.id)}
            />
            <span data-testid="todo-title">{todo.title}</span>
            <button
              data-testid="todo-delete"
              type="button"
              aria-label={`${todo.title} 삭제`}
              onClick={() => handleDelete(todo.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      <div data-testid="todo-count">{remainingCount}개 남음</div>
      <div>
        <button
          data-testid="filter-all"
          type="button"
          onClick={() => setFilter("all")}
        >
          전체
        </button>
        <button
          data-testid="filter-active"
          type="button"
          onClick={() => setFilter("active")}
        >
          미완료
        </button>
        <button
          data-testid="filter-completed"
          type="button"
          onClick={() => setFilter("completed")}
        >
          완료
        </button>
      </div>
    </div>
  );
}
