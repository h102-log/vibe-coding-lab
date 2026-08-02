import type { Todo } from "./types";

const STORAGE_KEY = "todo-app.todos";

export function loadTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Todo =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Todo).id === "string" &&
        typeof (item as Todo).title === "string" &&
        typeof (item as Todo).done === "boolean",
    );
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
