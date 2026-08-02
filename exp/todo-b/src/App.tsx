import { useState } from 'react';
import type { KeyboardEvent, FormEvent } from 'react';
import type { Filter } from './todo/types';
import { useTodos } from './todo/useTodos';
import TodoItem from './todo/TodoItem';

export default function App() {
  const { todos, add, toggle, remove } = useTodos();
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const visible = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
  // 필터와 무관하게 전체 미완료 개수를 센다.
  const remaining = todos.filter((todo) => !todo.completed).length;

  const submit = () => {
    if (add(draft)) setDraft('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  // Enter를 여기서 처리하고 기본 동작을 막는다 — 폼의 암묵적 제출과 겹쳐 두 번 추가되지 않도록.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    submit();
  };

  return (
    <main>
      <h1>할 일</h1>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          aria-label="할 일 입력"
          placeholder="할 일을 입력하고 Enter"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit">추가</button>
      </form>

      <ul>
        {visible.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggle}
            onDelete={remove}
          />
        ))}
      </ul>

      <p>
        <span data-testid="todo-count">{remaining}</span>개 남음
      </p>

      <nav>
        <button
          data-testid="filter-all"
          type="button"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          data-testid="filter-active"
          type="button"
          aria-pressed={filter === 'active'}
          onClick={() => setFilter('active')}
        >
          미완료
        </button>
        <button
          data-testid="filter-completed"
          type="button"
          aria-pressed={filter === 'completed'}
          onClick={() => setFilter('completed')}
        >
          완료
        </button>
      </nav>
    </main>
  );
}
