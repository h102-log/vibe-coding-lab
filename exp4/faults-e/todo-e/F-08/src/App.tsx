import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { Filter, Todo } from './todos';
import {
  addTodo,
  loadTodos,
  nextIdFor,
  remainingCount,
  removeTodo,
  saveTodos,
  toggleTodo,
  visibleTodos,
} from './todos';

const FILTERS: { value: Filter; testid: string; label: string }[] = [
  { value: 'all', testid: 'filter-all', label: '전체' },
  { value: 'active', testid: 'filter-active', label: '미완료' },
  { value: 'completed', testid: 'filter-completed', label: '완료' },
];

export default function App() {
  // P1 — 마운트 시 저장된 목록을 복원한다(초기화 함수는 첫 렌더에서 한 번만 돈다).
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all'); // P4 — 필터는 저장하지 않는다.
  const nextId = useRef(nextIdFor(todos)); // P2 — 복원된 id와 겹치지 않게 이어붙인다.

  // P5 — 목록이 바뀔 때마다 저장한다.
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  // U1·U2 — 추가 경로는 입력창의 Enter 하나뿐이다.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    if (event.nativeEvent.isComposing) return; // U11 — 조합 확정 Enter는 추가가 아니다.
    event.preventDefault();
    if (draft.trim() === '') return; // U5·U7 — 추가하지 않고 입력값도 건드리지 않는다.
    const id = nextId.current;
    nextId.current += 1;
    setTodos((prev) => addTodo(prev, id, draft));
    setDraft(''); // U6
  }

  const shown = visibleTodos(todos, filter);

  return (
    <main>
      <h1>할 일</h1>

      <input
        data-testid="todo-input"
        type="text"
        value={draft}
        placeholder="할 일을 입력하고 Enter"
        aria-label="할 일 입력"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <ul>
        {shown.map((todo) => (
          <li key={todo.id} data-testid="todo-item">
            <input
              data-testid="todo-toggle"
              type="checkbox"
              checked={todo.done}
              aria-label={`${todo.title} 완료`}
              onChange={() => setTodos((prev) => toggleTodo(prev, todo.id))}
            />
            <span data-testid="todo-title">{todo.title}</span>
            <button
              type="button"
              data-testid="todo-delete"
              onClick={() => setTodos((prev) => removeTodo(prev, todo.id))}
            >
            </button>
          </li>
        ))}
      </ul>

      <span data-testid="todo-count">{remainingCount(todos)}</span>

      <nav>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            data-testid={item.testid}
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
