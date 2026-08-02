import type { Todo } from './types';

const STORAGE_KEY = 'todo-app.todos.v1';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean'
  );
}

/** 저장된 값이 없거나 깨져 있으면 빈 목록으로 시작한다. 던지지 않는다. */
export function loadTodos(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isTodo)
      .map((todo) => ({ id: todo.id, title: todo.title, completed: todo.completed }));
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장소를 쓸 수 없는 환경에서도 화면 동작은 그대로 유지한다.
  }
}
