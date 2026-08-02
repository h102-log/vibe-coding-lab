import { useCallback, useEffect, useState } from 'react';
import type { Todo } from './types';
import { loadTodos, saveTodos } from './storage';

let sequence = 0;

function createId(): string {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function useTodos() {
  // 첫 렌더에서 바로 복원한다 — 빈 목록이 먼저 그려졌다 채워지는 일이 없도록.
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  /** 공백뿐인 제목은 거부한다. 추가했으면 true. */
  const add = useCallback((rawTitle: string): boolean => {
    const title = rawTitle.trim();
    if (title === '') return false;
    setTodos((prev) => [...prev, { id: createId(), title, completed: false }]);
    return true;
  }, []);

  const toggle = useCallback((id: string): void => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }, []);

  const remove = useCallback((id: string): void => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  return { todos, add, toggle, remove };
}
