import { useEffect, useState } from 'react';
import {
  activeCount,
  loadTodos,
  nextId,
  saveTodos,
  visibleTodos,
  type Filter,
  type Todo,
} from './todos.ts';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = () => {
    const title = draft.trim();
    if (title === '') return;
    setTodos((prev) => [...prev, { id: nextId(), title, completed: false }]);
    setDraft('');
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

  const visible = visibleTodos(todos, filter);
  const remaining = activeCount(todos);

  return (
    <div>
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
          placeholder="할 일을 입력하세요"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>

      <ul>
        {visible.map((todo) => (
          <li key={todo.id} data-testid="todo-item">
            <input
              type="checkbox"
              data-testid="todo-toggle"
              aria-label={`${todo.title} 완료`}
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
        <button type="button" data-testid="filter-all" onClick={() => setFilter('all')}>
          전체
        </button>
        <button type="button" data-testid="filter-active" onClick={() => setFilter('active')}>
          미완료
        </button>
        <button type="button" data-testid="filter-completed" onClick={() => setFilter('completed')}>
          완료
        </button>
      </div>
    </div>
  );
}
