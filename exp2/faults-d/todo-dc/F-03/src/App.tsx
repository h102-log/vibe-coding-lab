import { useEffect, useRef, useState } from 'react';
import type { Filter, Todo } from './todo/types.ts';
import { selectByFilter } from './todo/filter.ts';
import { loadTodos, nextIdFrom, saveTodos } from './todo/storage.ts';
import { TodoInput } from './todo/TodoInput.tsx';
import { TodoItem } from './todo/TodoItem.tsx';
import { TodoCount } from './todo/TodoCount.tsx';
import { FilterBar } from './todo/FilterBar.tsx';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [filter, setFilter] = useState<Filter>('all'); // U22/U35: 초기값 all, 복원하지 않는다.
  const nextId = useRef(0);
  if (nextId.current === 0) nextId.current = nextIdFrom(todos);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // U38: id 발급은 렌더가 아니라 이벤트 핸들러 안에서만 — StrictMode 이중 렌더에 안전.
  function addTodo(title: string) {
    const todo: Todo = { id: nextId.current++, title, completed: false };
    setTodos((prev) => [...prev, todo]); // U10: 맨 뒤에 붙는다.
  }

  function toggleTodo(_id: number) {
    // F-03: 앱 상태를 갱신하는 호출을 제거했다.
  }

  function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id)); // U17: 나머지 순서 보존.
  }

  const visible = selectByFilter(todos, filter);
  const activeCount = todos.filter((t) => !t.completed).length; // U19: 필터와 무관하게 전체 기준.

  return (
    <div>
      <h1>할 일 목록</h1>
      <TodoInput onAdd={addTodo} />
      <ul>
        {visible.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
        ))}
      </ul>
      <TodoCount count={activeCount} />
      <FilterBar current={filter} onChange={setFilter} />
    </div>
  );
}
