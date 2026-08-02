import type { Todo } from './todos'

type TodoItemProps = {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

/** U14: 토글·제목·삭제는 모두 자기 todo-item의 자손이다. */
export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`${todo.title} 완료`}
      />
      {/* U15: textContent는 제목과 정확히 같아야 한다. 장식 문자를 넣지 않는다. */}
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
