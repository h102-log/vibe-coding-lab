import { useEffect, useState } from 'react';
import type { Filter, Todo } from './todos.ts';
import {
  activeCount,
  loadTodos,
  nextId,
  saveTodos,
  visibleTodos,
} from './todos.ts';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const add = () => {
    const title = draft.trim();
    if (title === '') return;
    setTodos((prev) => [...prev, { id: nextId(prev), title, completed: false }]);
    setDraft('');
  };

  const toggle = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const remove = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const visible = visibleTodos(todos, filter);
  const remaining = activeCount(todos);

  return (
    <div>
      <h1>할 일</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          data-testid="todo-input"
          aria-label="할 일 입력"
          placeholder="할 일을 입력하세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </form>

      <ul>
        {visible.map((t) => (
          <li key={t.id} data-testid="todo-item">
            <input
              type="checkbox"
              data-testid="todo-toggle"
              aria-label={`${t.title} 완료`}
              checked={t.completed}
              onChange={() => toggle(t.id)}
            />
            <span data-testid="todo-title">{t.title}</span>
            <button
              type="button"
              data-testid="todo-delete"
              aria-label={`${t.title} 삭제`}
              onClick={() => remove(t.id)}
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
        <button
          type="button"
          data-testid="filter-completed"
          onClick={() => setFilter('completed')}
        >
          완료
        </button>
      </div>
    </div>
  );
}
