import type { Todo } from './types.ts';

const STORAGE_KEY = 'todo-dc.todos';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return typeof t.id === 'number' && typeof t.title === 'string' && typeof t.completed === 'boolean';
}

/** U31/U33: 마운트 시 저장된 목록을 복원한다. 저장소가 없거나 내용이 깨졌으면 빈 목록. */
export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTodo);
  } catch {
    return [];
  }
}

export function saveTodos(_todos: Todo[]): void {
  try {
    // F-07: 저장소에 상태를 쓰는 호출을 제거했다.
  } catch {
    // 저장소를 못 쓰는 환경에서도 앱 동작 자체는 막지 않는다.
  }
}

/** U34: 복원된 id와 겹치지 않는 다음 id. 겹치면 U13(항목 동일성)이 깨진다. */
export function nextIdFrom(todos: Todo[]): number {
  return todos.reduce((max, t) => (t.id > max ? t.id : max), 0) + 1;
}
