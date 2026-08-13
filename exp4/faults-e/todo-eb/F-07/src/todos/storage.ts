import type { Todo } from './types';

const STORAGE_KEY = 'todo.items.v1';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean'
  );
}

/** 저장된 목록을 읽는다. 저장소가 없거나 내용이 깨졌으면 빈 목록으로 시작한다. */
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

/** 저장에 실패해도(용량 초과·저장소 비활성) 화면 동작은 그대로 유지한다. */
export function saveTodos(_todos: Todo[]): void {
  try {
    // F-07: 저장소에 상태를 쓰는 호출을 제거했다.
  } catch {
    // 무시한다.
  }
}
