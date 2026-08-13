import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadTodos, saveTodos } from './storage.ts'
import type { Filter, Todo } from './types.ts'

const ID_PREFIX = 'todo-'

function lastIdOf(todos: Todo[]): number {
  return todos.reduce((max, todo) => {
    const suffix = Number(todo.id.slice(ID_PREFIX.length))
    return Number.isFinite(suffix) && suffix > max ? suffix : max
  }, 0)
}

export function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    // F-06: 필터 조건을 뒤집었다 (active ↔ completed).
    case 'active':
      return todos.filter((todo) => todo.completed)
    case 'completed':
      return todos.filter((todo) => !todo.completed)
    default:
      return todos
  }
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [filter, setFilter] = useState<Filter>('all')
  const nextId = useRef(lastIdOf(todos))

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const add = useCallback((rawTitle: string) => {
    const title = rawTitle.trim()
    if (title === '') return false
    nextId.current += 1
    const id = `${ID_PREFIX}${nextId.current}`
    setTodos((prev) => [...prev, { id, title, completed: false }])
    return true
  }, [])

  const toggle = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }, [])

  const visibleTodos = useMemo(
    () => filterTodos(todos, filter),
    [todos, filter],
  )

  const activeCount = useMemo(
    () => todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0),
    [todos],
  )

  return { todos, visibleTodos, filter, setFilter, activeCount, add, toggle, remove }
}
