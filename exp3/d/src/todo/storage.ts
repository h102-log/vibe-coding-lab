import type { Todo } from "./types";

/**
 * 항목 목록의 영속 저장. 앱을 다시 마운트해도 목록과 완료 상태가 남아야 한다. (SPEC U-34)
 * 저장소 접근은 전부 try/catch로 감싼다 — 저장소가 없거나 막힌 환경에서도 앱은 동작해야 한다.
 */

const STORAGE_KEY = "todos";

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.completed === "boolean"
  );
}

export function loadTodos(): Todo[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // 깨진 항목이 하나라도 있으면 전부 버린다. 부분 복구는 순서·id 일관성을 깨뜨린다.
    return parsed.every(isTodo)
      ? parsed.map((todo) => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장 실패는 화면 동작에 영향을 주지 않는다.
  }
}
