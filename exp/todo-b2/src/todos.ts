export type Todo = {
  id: number;
  title: string;
  done: boolean;
};

export type Filter = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'todos';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.done === 'boolean'
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
    // 저장할 수 없는 환경(비활성 스토리지·용량 초과)에서는 조용히 넘어간다.
  }
}

export function nextId(todos: Todo[]): number {
  return todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
}

export function visibleTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'active') return todos.filter((todo) => !todo.done);
  if (filter === 'completed') return todos.filter((todo) => todo.done);
  return todos;
}

export function remainingCount(todos: Todo[]): number {
  return todos.filter((todo) => !todo.done).length;
}
