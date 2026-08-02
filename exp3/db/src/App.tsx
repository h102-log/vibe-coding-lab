import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import TodoItem from './TodoItem'
import { loadTodos, saveTodos } from './storage'
import { activeCount, createTodo, normalizeTitle, reserveIds, visibleTodos } from './todos'
import type { Filter, Todo } from './todos'

const FILTERS: ReadonlyArray<{ value: Filter; testId: string; label: string }> = [
  { value: 'all', testId: 'filter-all', label: '전체' },
  { value: 'active', testId: 'filter-active', label: '미완료' },
  { value: 'completed', testId: 'filter-completed', label: '완료' },
]

/** U36/U38: 첫 렌더 이전에 저장된 목록을 읽고 id 카운터를 그 뒤로 맞춘다. */
function restoreTodos(): Todo[] {
  const restored = loadTodos()
  reserveIds(restored)
  return restored
}

/** U41/U42: 편집 중인 항목은 최대 하나다. 편집이 없으면 null이다. */
type Editing = { id: string; draft: string }

export default function App() {
  // U34: 저장된 것이 없으면 빈 목록으로 시작한다.
  const [todos, setTodos] = useState<Todo[]>(restoreTodos)
  const [draft, setDraft] = useState('')
  // U39: 필터 선택은 저장 대상이 아니다. 새로 열면 항상 "전체"다.
  const [filter, setFilter] = useState<Filter>('all')
  // U56: draft는 화면 상태일 뿐이라 todos와 따로 둔다. 저장되는 것은 todos뿐이다.
  const [editing, setEditing] = useState<Editing | null>(null)

  // U37: 목록이 바뀔 때마다 저장한다.
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const addTodo = () => {
    const title = normalizeTitle(draft)
    // U5/U7: 공백뿐이면 추가하지 않고, 입력값도 건드리지 않는다.
    if (title === '') return
    const todo = createTodo(title)
    setTodos((prev) => [...prev, todo]) // U8: 목록 끝에 붙는다.
    setDraft('') // U6: 성공했을 때만 비운다.
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    addTodo()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    // U3: 여기서 기본 동작을 막아야 form의 암묵적 submit과 겹쳐 두 번 추가되지 않는다.
    event.preventDefault()
    if (event.nativeEvent.isComposing) return // U12: 한글 조합 중 Enter는 확정용이다.
    addTodo()
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    )
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
    // U53: 편집하던 항목이 사라지면 편집 상태도 같이 끝난다.
    if (editing?.id === id) setEditing(null)
  }

  // U42/U43: 편집은 대상의 현재 제목에서 시작하고, 대상은 한 번에 하나다.
  const startEdit = (id: string) => {
    const target = todos.find((todo) => todo.id === id)
    if (target === undefined) return
    setEditing({ id, draft: target.title })
  }

  const changeEdit = (next: string) => {
    setEditing((prev) => (prev === null ? null : { ...prev, draft: next }))
  }

  const commitEdit = () => {
    if (editing === null) return
    const title = normalizeTitle(editing.draft) // U46: 추가와 같은 trim 규칙이다.
    // U49: 빈 제목은 제목이 될 수 없다(U5). 바꾸지 않고 편집만 끝낸다 — 삭제가 아니다.
    if (title !== '') {
      // U47: 제목만 갈아끼운다. completed·id·순서는 그대로다.
      setTodos((prev) =>
        prev.map((todo) => (todo.id === editing.id ? { ...todo, title } : todo)),
      )
    }
    setEditing(null) // U48
  }

  // U50/U52: 취소는 draft를 버리고 목록을 건드리지 않는다.
  const cancelEdit = () => {
    setEditing(null)
  }

  const visible = visibleTodos(todos, filter)
  const remaining = activeCount(todos)

  return (
    <main>
      <h1>할 일</h1>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="할 일을 입력하고 Enter"
          aria-label="새 할 일"
        />
      </form>

      <ul>
        {visible.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            editing={editing?.id === todo.id}
            editDraft={editing?.id === todo.id ? editing.draft : ''}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEditStart={startEdit}
            onEditChange={changeEdit}
            onEditCommit={commitEdit}
            onEditCancel={cancelEdit}
          />
        ))}
      </ul>

      {/* U20/U21: 항목이 없어도 렌더하고, 텍스트는 미완료 개수 숫자 하나뿐이다. */}
      <span data-testid="todo-count">{remaining}</span>

      <nav>
        {FILTERS.map((entry) => (
          <button
            key={entry.value}
            data-testid={entry.testId}
            type="button"
            aria-pressed={filter === entry.value} // U32
            onClick={() => setFilter(entry.value)} // U31: 선택된 버튼도 계속 눌린다.
          >
            {entry.label}
          </button>
        ))}
      </nav>
    </main>
  )
}
