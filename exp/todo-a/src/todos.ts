export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

export type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todo-a.todos.v1";

let seq = 0;

export function createTodo(title: string): Todo {
  seq += 1;
  return { id: `${Date.now().toString(36)}-${seq}`, title, done: false };
}

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
  let raw: string | null = null;
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

export function allDone(todos: Todo[]): boolean {
  return todos.length > 0 && todos.every((todo) => todo.done);
}

export function setAllDone(todos: Todo[], done: boolean): Todo[] {
  return todos.map((todo) => (todo.done === done ? todo : { ...todo, done }));
}

export function withoutCompleted(todos: Todo[]): Todo[] {
  return todos.filter((todo) => !todo.done);
}

export function searchTodos(todos: Todo[], query: string): Todo[] {
  if (query.length === 0) return todos;
  const needle = query.toLowerCase();
  return todos.filter((todo) => todo.title.toLowerCase().includes(needle));
}

export function remainingCount(todos: Todo[]): number {
  return todos.reduce((count, todo) => (todo.done ? count : count + 1), 0);
}
