import { useState, useEffect } from "react";

interface Todo {
  id: string;
  title: string;
  done: boolean;
}

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todos";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setTodos([
      ...todos,
      {
        id: Date.now().toString(),
        title: inputValue,
        done: false,
      },
    ]);
    setInputValue("");
  };

  const handleToggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.done;
    if (filter === "completed") return todo.done;
    return true;
  });

  const activeTodoCount = todos.filter((todo) => !todo.done).length;

  return (
    <div>
      <input
        data-testid="todo-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleAddTodo}
        aria-label="New todo"
      />

      <div data-testid="todo-count" aria-live="polite">
        {activeTodoCount} items left
      </div>

      <div>
        {filteredTodos.map((todo) => (
          <div key={todo.id} data-testid="todo-item">
            <input
              data-testid="todo-toggle"
              type="checkbox"
              checked={todo.done}
              onChange={() => handleToggleTodo(todo.id)}
              aria-label={`Toggle ${todo.title}`}
            />
            <span data-testid="todo-title">{todo.title}</span>
            <button
              data-testid="todo-delete"
              onClick={() => handleDeleteTodo(todo.id)}
              aria-label={`Delete ${todo.title}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <button
        data-testid="filter-all"
        onClick={() => setFilter("all")}
      >
        All
      </button>
      <button
        data-testid="filter-active"
        onClick={() => setFilter("active")}
      >
        Active
      </button>
      <button
        data-testid="filter-completed"
        onClick={() => setFilter("completed")}
      >
        Completed
      </button>
    </div>
  );
}
