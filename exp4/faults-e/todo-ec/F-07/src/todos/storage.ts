import type { Todo } from './model';

// U39: 키와 형식은 계약이 정하지 않았다. 검증 테스트가 저장소를 직접 다룰 수 있게 내보낸다.
export const STORAGE_KEY = 'todo-ec/todos/v1';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.done === 'boolean'
  );
}

/** U29: 저장된 목록을 복원한다. U39: 없거나 깨졌으면 빈 목록으로 시작하고 예외를 던지지 않는다. */
export function loadTodos(): Todo[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw == null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isTodo)
      .map((todo) => ({ id: todo.id, title: todo.title, done: todo.done }));
  } catch {
    // 저장소를 못 읽거나 JSON이 깨진 경우 — 빈 목록에서 시작한다.
    return [];
  }
}

/** U42: 저장이 막힌 환경(용량 초과·차단)에서도 화면 동작은 계속된다. */
export function saveTodos(_todos: readonly Todo[]): void {
  try {
    // F-07: 저장소에 상태를 쓰는 호출을 제거했다.
  } catch {
    // 저장 실패는 화면 동작을 막지 않는다.
  }
}
