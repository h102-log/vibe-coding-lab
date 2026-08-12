import { useEffect, useState } from 'react';
import { loadTodos, saveTodos } from './storage';
import type { Todo } from './types';

/**
 * 할 일 목록의 상태. 브라우저 저장소에 유지되어 다시 마운트해도 살아남는다(SPEC U-34).
 * id는 setState updater 안에서 기존 최대값+1로 계산하므로 순수하고,
 * StrictMode 이중 호출에서도 항목이 중복 생성되지 않는다(SPEC U-35).
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  /** 추가에 성공하면 true. 앞뒤 공백을 지운 제목이 비면 아무것도 바꾸지 않는다. */
  const add = (raw: string): boolean => {
    const title = raw.trim();
    if (title === '') return false;

    setTodos((prev) => {
      const id = prev.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
      return [...prev, { id, title, completed: false }];
    });
    return true;
  };

  const toggle = (_id: number): void => {
    // F-03: 앱 상태를 갱신하는 호출을 제거했다.
  };

  const remove = (id: number): void => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const remaining = todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0);

  return { todos, add, toggle, remove, remaining };
}
