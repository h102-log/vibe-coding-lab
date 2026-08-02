import type { Todo } from './todos'

export const STORAGE_KEY = 'todo-db.todos.v1'

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean'
  )
}

/** 저장소가 없는 환경(빌드 시 프리렌더, 차단된 브라우저)에서도 앱은 돌아야 한다. */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** U36: 저장된 목록을 복원한다. 값이 없거나 깨져 있으면 빈 목록으로 시작한다. */
export function loadTodos(): Todo[] {
  const store = storage()
  if (store === null) return []
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTodo)
  } catch {
    return []
  }
}

/** U37: 목록이 바뀔 때마다 통째로 덮어쓴다. */
export function saveTodos(todos: readonly Todo[]): void {
  const store = storage()
  if (store === null) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {
    // 저장 실패(용량 초과·프라이빗 모드)가 화면 동작을 막지는 않는다.
  }
}
