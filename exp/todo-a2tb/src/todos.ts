export type Filter = 'all' | 'active' | 'completed';

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const STORAGE_KEY = 'todos';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'number' &&
    typeof t.title === 'string' &&
    typeof t.completed === 'boolean'
  );
}

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
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
    // 저장할 수 없는 환경이면 메모리 상태만 유지한다.
  }
}

export function nextId(todos: Todo[]): number {
  return todos.reduce((max, t) => (t.id > max ? t.id : max), 0) + 1;
}

export function visibleTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'active') return todos.filter((t) => !t.completed);
  if (filter === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

export function activeCount(todos: Todo[]): number {
  return todos.filter((t) => !t.completed).length;
}
