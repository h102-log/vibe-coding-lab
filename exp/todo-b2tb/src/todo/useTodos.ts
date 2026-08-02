import { useCallback, useEffect, useRef, useState } from "react";
import { loadTodos, saveTodos } from "./storage";
import type { Todo } from "./types";

/**
 * 항목 목록과 그 변경 연산.
 * 마운트 시 저장소에서 복원하고, 목록이 바뀔 때마다 저장한다 (SPEC U-29).
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  // 복원된 항목과 id가 겹치지 않도록 최대 id 다음부터 발급한다.
  const nextId = useRef(
    todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1,
  );

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const add = useCallback((title: string) => {
    const id = nextId.current;
    nextId.current += 1;
    setTodos((prev) => [...prev, { id, title, completed: false }]);
  }, []);

  const toggle = useCallback((id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }, []);

  const remove = useCallback((id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  return { todos, add, toggle, remove };
}
