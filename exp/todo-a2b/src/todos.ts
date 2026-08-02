export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type Filter = 'all' | 'active' | 'completed';

export const STORAGE_KEY = 'todos';

let seq = 0;

export function nextId(): string {
  seq += 1;
  return `todo-${seq}`;
}

function bumpSeq(id: string): void {
  const n = Number(id.replace(/^todo-/, ''));
  if (Number.isFinite(n) && n > seq) seq = n;
}

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.completed === 'boolean'
  );
}

export function loadTodos(): Todo[] {
  let raw: string | null = null;
  try {
    raw = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return [];
  }
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const todos = parsed.filter(isTodo);
  todos.forEach((todo) => bumpSeq(todo.id));
  return todos;
}

export function saveTodos(todos: Todo[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장할 수 없는 환경(용량 초과 등)에서는 메모리 상태만 유지한다.
  }
}

export function visibleTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'active') return todos.filter((todo) => !todo.completed);
  if (filter === 'completed') return todos.filter((todo) => todo.completed);
  return todos;
}

export function activeCount(todos: Todo[]): number {
  return todos.filter((todo) => !todo.completed).length;
}
