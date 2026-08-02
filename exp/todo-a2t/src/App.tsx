import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import FilterBar from './todo/FilterBar.tsx'
import TodoItem from './todo/TodoItem.tsx'
import { useTodos } from './todo/useTodos.ts'

export default function App() {
  const { visibleTodos, filter, setFilter, activeCount, add, toggle, remove } =
    useTodos()
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (add(draft)) setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    submit()
  }

  return (
    <main>
      <h1>할 일</h1>

      <input
        data-testid="todo-input"
        type="text"
        value={draft}
        placeholder="할 일을 입력하세요"
        aria-label="할 일 입력"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <FilterBar filter={filter} onChange={setFilter} />

      <ul>
        {visibleTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggle}
            onDelete={remove}
          />
        ))}
      </ul>

      <span data-testid="todo-count">{activeCount}</span>
    </main>
  )
}
