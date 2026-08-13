import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { TodoItem } from './todos/TodoItem';
import type { Filter } from './todos/types';
import { useTodos } from './todos/useTodos';

const FILTERS: { key: Filter; testid: string; label: string }[] = [
  { key: 'all', testid: 'filter-all', label: '전체' },
  { key: 'active', testid: 'filter-active', label: '미완료' },
  { key: 'completed', testid: 'filter-completed', label: '완료' },
];

export default function App() {
  const { todos, add, toggle, remove, remaining } = useTodos();
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');

  const visible = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // 추가에 실패하면 입력값을 그대로 둔다(SPEC U-06).
  const submit = () => {
    if (add(draft)) setDraft('');
  };

  // DOM 계약에 추가 버튼이 없으므로 Enter가 유일한 추가 수단이다(SPEC U-01).
  // keydown에서 기본 동작을 막아 form의 암묵적 제출과 겹쳐 두 번 추가되는 일을 없앤다.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <main>
      <h1>할 일</h1>

      <form onSubmit={onSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          value={draft}
          placeholder="할 일을 입력하고 Enter"
          aria-label="할 일 입력"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </form>

      <ul>
        {visible.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
        ))}
      </ul>

      {/* 현재 필터와 무관하게 전체 미완료 개수를 센다(SPEC U-22). 숫자만 넣는다(SPEC U-21). */}
      <span data-testid="todo-count">{remaining}</span>

      <nav>
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            data-testid={item.testid}
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
