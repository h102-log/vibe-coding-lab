import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type { Filter, Todo } from './todos.ts';
import {
  addTodo,
  countActive,
  normalizeTitle,
  removeTodo,
  selectVisible,
  toggleTodo,
} from './todos.ts';
import { loadTodos, nextIdSeed, saveTodos } from './storage.ts';

const FILTERS: ReadonlyArray<{ value: Filter; testId: string; label: string }> = [
  { value: 'all', testId: 'filter-all', label: '전체' },
  { value: 'active', testId: 'filter-active', label: '미완료' },
  { value: 'completed', testId: 'filter-completed', label: '완료' },
];

export default function App() {
  // 마운트 시 저장된 목록을 복원한다. (U30')
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const nextId = useRef(nextIdSeed(todos));

  // 목록이 바뀔 때마다 저장한다. (U39)
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  /** 입력창의 현재 값을 항목으로 확정한다. 추가되면 true. (U2~U6) */
  function commitDraft(): boolean {
    const title = normalizeTitle(draft);
    if (title === null) return false;

    nextId.current += 1;
    setTodos((current) => addTodo(current, `todo-${nextId.current}`, title));
    setDraft('');
    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commitDraft();
  }

  // Enter 키다운을 직접 받고 기본동작을 막는다. 폼의 암묵적 submit과 겹쳐
  // 항목이 두 번 추가되는 일이 없도록 하기 위함이다. (U3)
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commitDraft();
  }

  const visible = selectVisible(todos, filter);
  const activeCount = countActive(todos);

  return (
    <main>
      <h1>할 일</h1>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="할 일을 입력하고 Enter"
          aria-label="새 할 일"
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
              onChange={() => setTodos((current) => toggleTodo(current, todo.id))}
              aria-label={`${todo.title} 완료`}
            />
            <span data-testid="todo-title">{todo.title}</span>
            <button
              data-testid="todo-delete"
              type="button"
              onClick={() => setTodos((current) => removeTodo(current, todo.id))}
              aria-label={`${todo.title} 삭제`}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      <p>
        <span data-testid="todo-count">{activeCount}</span>
      </p>

      <nav>
        {FILTERS.map((entry) => (
          <button
            key={entry.value}
            data-testid={entry.testId}
            type="button"
            aria-pressed={filter === entry.value}
            onClick={() => setFilter(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
