export type Todo = {
  id: number;
  title: string;
  done: boolean;
};

export type Filter = 'all' | 'active' | 'completed';

/** U3·U4·U5 — 앞뒤 공백을 제거한 제목이 비면 목록을 그대로 돌려준다. */
export function addTodo(todos: Todo[], id: number, rawTitle: string): Todo[] {
  const title = rawTitle.trim();
  if (title === '') return todos;
  return [...todos, { id, title, done: false }];
}

/** U12·U15 — id로 지정한 항목의 완료 상태만 뒤집는다. */
export function toggleTodo(todos: Todo[], id: number): Todo[] {
  return todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

/** U14·U15 — id로 지정한 항목만 빼고 나머지 순서는 보존한다. */
export function removeTodo(todos: Todo[], id: number): Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

/** U18·U19·U20 — 필터에 걸리는 항목만 골라낸다. */
export function visibleTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'active') return todos.filter((todo) => !todo.done);
  if (filter === 'completed') return todos.filter((todo) => todo.done);
  return todos;
}

/** U26 — 필터와 무관하게 전체 항목 중 미완료 개수. */
export function remainingCount(todos: Todo[]): number {
  return todos.reduce((count, todo) => (todo.done ? count : count + 1), 0);
}

export const STORAGE_KEY = 'todo-e.todos.v1';

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === 'number' &&
    Number.isFinite(todo.id) &&
    typeof todo.title === 'string' &&
    typeof todo.done === 'boolean'
  );
}

/** P1·P3 — 저장된 목록을 읽는다. 값이 없거나 깨져 있으면 빈 목록. */
export function loadTodos(): Todo[] {
  let raw: string | null = null;
  try {
    raw = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
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

/** P1·P5 — 목록을 저장한다. 저장소를 쓸 수 없어도 앱은 계속 돈다. */
export function saveTodos(_todos: Todo[]): void {
  try {
    // F-07: 저장소에 상태를 쓰는 호출을 제거했다.
  } catch {
    // 저장 실패는 화면 동작에 영향을 주지 않는다.
  }
}

/** P2 — 복원된 항목과 겹치지 않는 다음 id. */
export function nextIdFor(todos: Todo[]): number {
  return todos.reduce((max, todo) => (todo.id > max ? todo.id : max), 0) + 1;
}
