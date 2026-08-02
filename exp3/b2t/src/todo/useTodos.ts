import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadTodos, saveTodos } from './storage';
import type { Filter, Todo } from './types';

const ID_PREFIX = 'todo-';

function visibleUnder(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.done);
    case 'completed':
      return todos.filter((todo) => todo.done);
    case 'all':
      return todos;
  }
}

/** 복원된 항목의 id와 새 id가 겹치지 않도록 다음 번호를 정한다. */
function nextIdAfter(todos: Todo[]): number {
  return todos.reduce((max, todo) => {
    const serial = Number.parseInt(todo.id.slice(ID_PREFIX.length), 10);
    return Number.isFinite(serial) && serial >= max ? serial + 1 : max;
  }, 1);
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [filter, setFilter] = useState<Filter>('all');
  // 편집 상태는 화면 상태다. 항목과 달리 저장소에 남기지 않는다.
  const [editingId, setEditingId] = useState<string | null>(null);
  const nextId = useRef(0);
  if (nextId.current === 0) nextId.current = nextIdAfter(todos);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const add = useCallback((rawTitle: string) => {
    const title = rawTitle.trim();
    if (title === '') return;
    const id = `${ID_PREFIX}${nextId.current}`;
    nextId.current += 1;
    setTodos((prev) => [...prev, { id, title, done: false }]);
  }, []);

  const toggle = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    // 사라진 항목의 편집 상태가 남으면 다음 편집 때 입력창이 둘로 보인다.
    setEditingId((current) => (current === id ? null : current));
  }, []);

  const beginEdit = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const commitEdit = useCallback((id: string, rawTitle: string) => {
    const title = rawTitle.trim();
    setEditingId((current) => (current === id ? null : current));
    // 빈 제목으로는 항목이 생기지 않는 것과 같은 규칙: 빈 제목으로는 제목도 바뀌지 않는다.
    if (title === '') return;
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, title } : todo)));
  }, []);

  const visibleTodos = useMemo(() => visibleUnder(todos, filter), [todos, filter]);
  const remainingCount = useMemo(
    () => todos.reduce((count, todo) => (todo.done ? count : count + 1), 0),
    [todos],
  );

  return {
    visibleTodos,
    remainingCount,
    filter,
    setFilter,
    editingId,
    add,
    toggle,
    remove,
    beginEdit,
    cancelEdit,
    commitEdit,
  };
}
