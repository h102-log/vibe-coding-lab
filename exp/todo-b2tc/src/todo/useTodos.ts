import { useCallback, useEffect, useState } from 'react';
import { loadTodos, saveTodos } from './storage';
import type { Filter, Todo } from './types';

// 목록 안에서만 유일하면 된다. 순수 함수라 StrictMode의 이중 호출에도 안전하다.
function nextIdFor(todos: Todo[]): number {
  return todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [filter, setFilter] = useState<Filter>('all');

  // 다시 마운트해도 목록이 남아 있어야 한다.
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback((title: string) => {
    const trimmed = title.trim();
    if (trimmed === '') return;
    setTodos((prev) => [...prev, { id: nextIdFor(prev), title: trimmed, completed: false }]);
  }, []);

  const toggleTodo = useCallback((id: number) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  }, []);

  const removeTodo = useCallback((id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const activeCount = todos.filter((todo) => !todo.completed).length;

  return { todos, filter, activeCount, addTodo, toggleTodo, removeTodo, setFilter };
}
