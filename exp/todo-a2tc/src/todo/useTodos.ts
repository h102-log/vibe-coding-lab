import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadTodos, saveTodos } from './storage.ts';
import type { Filter, Todo } from './types.ts';

let nextId = 0;

function createId() {
  nextId += 1;
  return `todo-${nextId}`;
}

/** 복원된 항목과 새 항목의 id가 겹치지 않도록 카운터를 밀어 둔다. */
function reserveIds(todos: Todo[]) {
  for (const todo of todos) {
    const suffix = Number(todo.id.replace(/^todo-/, ''));
    if (Number.isFinite(suffix) && suffix > nextId) nextId = suffix;
  }
  return todos;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => reserveIds(loadTodos()));
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback((rawTitle: string) => {
    const title = rawTitle.trim();
    if (title === '') return false;
    setTodos((prev) => [...prev, { id: createId(), title, completed: false }]);
    return true;
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const activeCount = useMemo(
    () => todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0),
    [todos],
  );

  return {
    todos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    removeTodo,
    visibleTodos,
    activeCount,
  };
}
