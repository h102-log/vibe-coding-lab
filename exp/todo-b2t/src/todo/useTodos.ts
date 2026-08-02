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
  }, []);

  const visibleTodos = useMemo(() => visibleUnder(todos, filter), [todos, filter]);
  const remainingCount = useMemo(
    () => todos.reduce((count, todo) => (todo.done ? count : count + 1), 0),
    [todos],
  );

  return { visibleTodos, remainingCount, filter, setFilter, add, toggle, remove };
}
