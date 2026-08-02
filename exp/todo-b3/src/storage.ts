import type { Todo } from './todos.ts';

export const STORAGE_KEY = 'todos';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.completed === 'boolean'
  );
}

/**
 * 저장된 목록을 읽는다. 저장소가 없거나 값이 깨져 있으면 빈 목록.
 * 앱이 저장소 상태 때문에 예외로 죽지 않는 것이 이 함수의 책임이다. (U38, U41)
 */
export function loadTodos(): Todo[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isTodo);
  } catch {
    return [];
  }
}

/** 목록을 저장한다. 저장소를 쓸 수 없어도 앱은 계속 동작한다. (U39, U41) */
export function saveTodos(todos: readonly Todo[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장소 접근 불가(quota 초과·비활성)는 무시한다. 화면 상태가 진실이다.
  }
}

/** 복원된 id와 새로 만들 id가 겹치지 않도록 카운터 시작값을 정한다. (U40) */
export function nextIdSeed(todos: readonly Todo[]): number {
  return todos.reduce((max, todo) => {
    const match = /^todo-(\d+)$/.exec(todo.id);
    if (match === null) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
}
