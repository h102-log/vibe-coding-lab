export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

export type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todo-app.items.v1";

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.done === "boolean"
  );
}

export function loadTodos(): Todo[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (raw === null) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTodo);
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장소를 못 쓰는 환경에서도 앱은 계속 동작한다.
  }
}

export function nextId(todos: Todo[]): string {
  const max = todos.reduce((acc, todo) => {
    const n = Number(todo.id);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return String(max + 1);
}

export function visibleTodos(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case "active":
      return todos.filter((todo) => !todo.done);
    case "completed":
      return todos.filter((todo) => todo.done);
    case "all":
      return todos;
  }
}
