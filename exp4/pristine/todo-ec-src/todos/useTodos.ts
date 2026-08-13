import { useCallback, useEffect, useState } from 'react';
import type { Todo } from './model';
import { addTodo, removeTodo, toggleTodo } from './model';
import { loadTodos, saveTodos } from './storage';

export function useTodos() {
  // U29: 저장된 목록에서 시작한다. U39: 없거나 깨졌으면 빈 목록이다.
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  // U29: 목록이 바뀔 때마다 저장한다. 다시 마운트하면 여기서 쓴 값을 읽는다.
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // updater는 모두 순수하다 — StrictMode가 두 번 불러도 결과가 같다(U38).
  const add = useCallback((rawTitle: string) => {
    setTodos((prev) => addTodo(prev, rawTitle));
  }, []);

  const toggle = useCallback((id: string) => {
    setTodos((prev) => toggleTodo(prev, id));
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => removeTodo(prev, id));
  }, []);

  return { todos, add, toggle, remove };
}
