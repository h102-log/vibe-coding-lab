import { useCallback, useEffect, useState } from 'react';
import { loadTodos, saveTodos } from './storage';
import type { Filter, Todo } from './types';

// 목록 안에서만 유일하면 된다. 순수 함수라 StrictMode의 이중 호출에도 안전하다.
function nextIdFor(todos: Todo[]): number {
  return todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [filter, setFilterState] = useState<Filter>('all');
  // 편집 중인 항목은 한 번에 하나뿐이다. null이면 편집 중이 아니다.
  const [editingId, setEditingId] = useState<number | null>(null);

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
    // 식별자는 재사용될 수 있으므로(§46a), 편집 중이던 항목이 사라지면 편집 상태도 지운다.
    setEditingId((current) => (current === id ? null : current));
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const setFilter = useCallback((next: Filter) => {
    setEditingId(null);
    setFilterState(next);
  }, []);

  const startEditing = useCallback((id: number) => {
    setEditingId(id);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  const commitEditing = useCallback((id: number, title: string) => {
    setEditingId(null);
    const trimmed = title.trim();
    // 빈 제목은 만들지 않는다(추가와 같은 규칙). 항목을 지우지도 않고 원래 제목을 남긴다.
    if (trimmed === '') return;
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo)));
  }, []);

  const activeCount = todos.filter((todo) => !todo.completed).length;

  return {
    todos,
    filter,
    activeCount,
    editingId,
    addTodo,
    toggleTodo,
    removeTodo,
    setFilter,
    startEditing,
    commitEditing,
    cancelEditing,
  };
}
