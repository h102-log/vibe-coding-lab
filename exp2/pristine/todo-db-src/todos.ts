export type Todo = {
  id: string
  title: string
  completed: boolean
}

export type Filter = 'all' | 'active' | 'completed'

const ID_PREFIX = 'todo-'

let sequence = 0

/** U13: 제목이 같아도 항목마다 유일한 식별자를 준다. */
export function createTodo(title: string): Todo {
  sequence += 1
  return { id: `${ID_PREFIX}${sequence}`, title, completed: false }
}

/**
 * U38: 복원된 항목의 id와 앞으로 만들 id가 겹치지 않게 카운터를 밀어 올린다.
 * 새로고침하면 카운터는 0부터 다시 시작하므로 이 보정이 없으면 key가 충돌한다.
 */
export function reserveIds(todos: readonly Todo[]): void {
  for (const todo of todos) {
    if (!todo.id.startsWith(ID_PREFIX)) continue
    const used = Number(todo.id.slice(ID_PREFIX.length))
    if (Number.isInteger(used) && used > sequence) sequence = used
  }
}

/** U4: 앞뒤 공백만 제거하고 내부 공백은 보존한다. */
export function normalizeTitle(raw: string): string {
  return raw.trim()
}

/** U26~U28: 걸러진 항목은 렌더 대상에서 아예 빠진다(숨기지 않는다). */
export function visibleTodos(todos: readonly Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed)
    case 'completed':
      return todos.filter((todo) => todo.completed)
    case 'all':
      return todos.slice()
  }
}

/** U22: 현재 필터와 무관하게 전체 목록에서 센다. */
export function activeCount(todos: readonly Todo[]): number {
  return todos.filter((todo) => !todo.completed).length
}
