import { useState } from 'react';
import type { Filter } from './todos/model';
import { activeCount, visibleTodos } from './todos/model';
import { useTodos } from './todos/useTodos';
import TodoInput from './todos/TodoInput';
import TodoItem from './todos/TodoItem';
import FilterBar from './todos/FilterBar';

export default function App() {
  const { todos, add, toggle, remove } = useTodos();
  // U20: 초기 필터는 '전체'.
  const [filter, setFilter] = useState<Filter>('all');

  const visible = visibleTodos(todos, filter);

  return (
    <main>
      <h1>할 일</h1>

      <TodoInput onAdd={add} />

      <ul>
        {visible.map((todo) => (
          // U34: key는 제목이나 인덱스가 아니라 항목 id다.
          <TodoItem key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
        ))}
      </ul>

      <p>
        {/* U16: 이 요소의 텍스트는 숫자뿐이다. 단위 문구는 바깥의 다른 요소에 둔다. */}
        <span data-testid="todo-count">{activeCount(todos)}</span>
        <span>개 남음</span>
      </p>

      <FilterBar filter={filter} onChange={setFilter} />
    </main>
  );
}
