export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export const STORAGE_KEY = "todos";

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.completed === "boolean"
  );
}

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

export function saveTodos(todos: Todo[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장소를 못 쓰는 환경에서는 메모리 상태만 유지한다.
  }
}
