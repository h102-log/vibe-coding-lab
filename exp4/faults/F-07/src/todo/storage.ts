import type { Todo } from './types.ts'

export const STORAGE_KEY = 'todo-a2t/todos'

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false
  const todo = value as Record<string, unknown>
  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.completed === 'boolean'
  )
}

export function loadTodos(): Todo[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (raw === null || raw === undefined) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTodo).map(({ id, title, completed }) => ({
      id,
      title,
      completed,
    }))
  } catch {
    return []
  }
}

export function saveTodos(_todos: Todo[]): void {
  try {
    // F-07: 저장소에 상태를 쓰는 호출을 제거했다.
  } catch {
    // 저장소를 쓸 수 없으면 메모리 상태만 유지한다.
  }
}
