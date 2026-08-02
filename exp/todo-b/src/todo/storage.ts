import type { Todo } from './types';

/** 목록을 담는 localStorage 키. 필터 상태는 저장하지 않는다. */
const STORAGE_KEY = 'todos';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean'
  );
}

/** 저장된 값이 없거나 깨져 있으면 빈 목록으로 시작한다. 예외를 밖으로 던지지 않는다. */
export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTodo).map((todo) => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
    }));
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장할 수 없는 환경(용량 초과·접근 차단)에서도 앱은 계속 동작한다.
  }
}
