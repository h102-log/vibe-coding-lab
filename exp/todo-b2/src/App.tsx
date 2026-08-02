import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  loadTodos,
  nextId,
  remainingCount,
  saveTodos,
  visibleTodos,
} from './todos.ts';
import type { Filter, Todo } from './todos.ts';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const shown = visibleTodos(todos, filter);
  const remaining = remainingCount(todos);

  const submit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    const title = draft.trim();
    setDraft('');
    if (title === '') return;
    setTodos((prev) => [...prev, { id: nextId(prev), title, done: false }]);
  };

  const toggle = (id: number) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );
  };

  const remove = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <main>
      <h1>할 일</h1>
      <input
        data-testid="todo-input"
        aria-label="할 일 입력"
        placeholder="할 일을 입력하고 Enter"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={submit}
      />
      <ul>
        {shown.map((todo) => (
          <li key={todo.id} data-testid="todo-item">
            <input
              type="checkbox"
              data-testid="todo-toggle"
              aria-label={`${todo.title} 완료`}
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
      <p>
        남은 항목 <span data-testid="todo-count">{remaining}</span>개
      </p>
      <nav>
        <button
          type="button"
          data-testid="filter-all"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          type="button"
          data-testid="filter-active"
          aria-pressed={filter === 'active'}
          onClick={() => setFilter('active')}
        >
          미완료
        </button>
        <button
          type="button"
          data-testid="filter-completed"
          aria-pressed={filter === 'completed'}
          onClick={() => setFilter('completed')}
        >
          완료
        </button>
      </nav>
    </main>
  );
}
