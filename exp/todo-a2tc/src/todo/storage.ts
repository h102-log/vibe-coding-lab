import type { Todo } from './types.ts';

const STORAGE_KEY = 'todo-app/todos';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean'
  );
}

export function loadTodos(): Todo[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTodo).map(({ id, title, completed }) => ({
      id,
      title,
      completed,
    }));
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장소를 쓸 수 없으면 메모리 상태만 유지한다.
  }
}
