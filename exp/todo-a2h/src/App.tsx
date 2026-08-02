import { useState, useEffect } from 'react';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  // Save to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: trimmed,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInput('');
  };

  const handleToggle = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDelete = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeCount = todos.filter(todo => !todo.completed).length;

  return (
    <div>
      <form onSubmit={handleAddTodo}>
        <input
          data-testid="todo-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new todo"
          aria-label="Add a new todo"
        />
      </form>

      <div>
        {filteredTodos.map(todo => (
          <div key={todo.id} data-testid="todo-item">
            <input
              type="checkbox"
              data-testid="todo-toggle"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
              aria-label={`Toggle todo: ${todo.title}`}
            />
            <span data-testid="todo-title">{todo.title}</span>
            <button
              data-testid="todo-delete"
              onClick={() => handleDelete(todo.id)}
              aria-label={`Delete todo: ${todo.title}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div data-testid="todo-count">{activeCount}</div>

      <div>
        <button
          data-testid="filter-all"
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          data-testid="filter-active"
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          data-testid="filter-completed"
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>
    </div>
  );
}
