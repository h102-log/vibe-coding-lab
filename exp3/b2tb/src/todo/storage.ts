import type { Todo } from "./types";

const STORAGE_KEY = "todo-b2tb.todos";

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.completed === "boolean"
  );
}

/** 저장된 항목을 읽는다. 저장소가 없거나 내용이 깨졌으면 빈 목록으로 시작한다. */
export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isTodo)
      .map(({ id, title, completed }) => ({ id, title, completed }));
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장 실패(용량 초과·접근 차단)가 화면 동작을 막지는 않는다.
  }
}
