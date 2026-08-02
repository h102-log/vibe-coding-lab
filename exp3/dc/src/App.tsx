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
  // X28/X29: 편집 상태도 화면 상태다 — 저장·복원하지 않고, 모듈 스코프에도 두지 않는다.
  const [editingId, setEditingId] = useState<number | null>(null);
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

  function toggleTodo(id: number) {
    // U13/U15: 제목이 아니라 id로 찾고, 대상 하나만 반전한다.
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id)); // U17: 나머지 순서 보존.
    setEditingId((cur) => (cur === id ? null : cur)); // X25
  }

  function startEdit(id: number) {
    setEditingId(id); // X5/X10: 편집 대상은 하나뿐이므로 대입이 곧 이전 편집의 폐기다.
  }

  // X13/X14: title만 갈아끼운다 — id·completed·목록 내 위치는 그대로다.
  function commitEdit(id: number, title: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null); // X20/X24: 제목은 건드리지 않고 편집 상태만 끝낸다.
  }

  // X25: 필터를 옮기면 편집 중이던 항목이 화면에서 사라질 수 있다. 편집 상태를 남기면
  // 나중에 그 항목이 다시 보일 때 편집 모드가 되살아난다.
  function changeFilter(next: Filter) {
    setFilter(next);
    setEditingId(null);
  }

  const visible = selectByFilter(todos, filter);
  const activeCount = todos.filter((t) => !t.completed).length; // U19: 필터와 무관하게 전체 기준.

  return (
    <div>
      <h1>할 일 목록</h1>
      <TodoInput onAdd={addTodo} />
      <ul>
        {visible.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            // X6/X25: 보이는 항목에서만 파생된다. 편집 중이던 항목이 목록에서 빠지면 편집 UI도 없다.
            editing={todo.id === editingId}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
          />
        ))}
      </ul>
      <TodoCount count={activeCount} />
      <FilterBar current={filter} onChange={changeFilter} />
    </div>
  );
}
