import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Filter, Todo } from './todos.ts';
import { activeCount, createTodo, filterTodos } from './todos.ts';
import { loadTodos, saveTodos } from './storage.ts';

const FILTERS: { key: Filter; testid: string; label: string }[] = [
  { key: 'all', testid: 'filter-all', label: '전체' },
  { key: 'active', testid: 'filter-active', label: '미완료' },
  { key: 'completed', testid: 'filter-completed', label: '완료' },
];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const visible = useMemo(() => filterTodos(todos, filter), [todos, filter]);
  const remaining = activeCount(todos);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (title === '') {
      setDraft('');
      return;
    }
    setTodos((prev) => [...prev, createTodo(title)]);
    setDraft('');
  }

  function handleDraftChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  return (
    <main>
      <h1>할 일</h1>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          value={draft}
          placeholder="무엇을 해야 하나요?"
          aria-label="할 일 입력"
          onChange={handleDraftChange}
        />
        <button type="submit">추가</button>
      </form>

      <ul>
        {visible.map((todo) => (
          <li key={todo.id} data-testid="todo-item">
            <input
              data-testid="todo-toggle"
              type="checkbox"
              checked={todo.completed}
              aria-label={`${todo.title} 완료`}
              onChange={() => toggleTodo(todo.id)}
            />
            <span data-testid="todo-title">{todo.title}</span>
            <button
              data-testid="todo-delete"
              type="button"
              aria-label={`${todo.title} 삭제`}
              onClick={() => deleteTodo(todo.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      <footer>
        <span data-testid="todo-count">{remaining}</span>
        <nav>
          {FILTERS.map((item) => (
            <button
              key={item.key}
              data-testid={item.testid}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </footer>
    </main>
  );
}
