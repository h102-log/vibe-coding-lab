import type { Todo } from './types.ts'

type TodoItemProps = {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li data-testid="todo-item" data-completed={todo.completed}>
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        aria-label={`${todo.title} 완료`}
        onChange={() => onToggle(todo.id)}
      />
      <span data-testid="todo-title">{todo.title}</span>
      <button
        data-testid="todo-delete"
        type="button"
        onClick={() => onDelete(todo.id)}
      >
      </button>
    </li>
  )
}
