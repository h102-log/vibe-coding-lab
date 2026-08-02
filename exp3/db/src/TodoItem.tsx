import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { Todo } from './todos'

type TodoItemProps = {
  todo: Todo
  editing: boolean
  editDraft: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEditStart: (id: string) => void
  onEditChange: (draft: string) => void
  onEditCommit: () => void
  onEditCancel: () => void
}

/** U14/U40: 토글·제목·삭제·편집창은 모두 자기 todo-item의 자손이다. */
export default function TodoItem({
  todo,
  editing,
  editDraft,
  onToggle,
  onDelete,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: TodoItemProps) {
  const editRef = useRef<HTMLInputElement>(null)

  // U44: 편집을 시작할 때만 포커스를 옮기고 캐럿을 끝에 둔다.
  // 의존성이 editing뿐이라 타이핑 중에는 다시 돌지 않는다(캐럿이 튀지 않는다).
  useEffect(() => {
    if (!editing) return
    const node = editRef.current
    if (node === null) return
    node.focus()
    const end = node.value.length
    node.setSelectionRange(end, end)
  }, [editing])

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (event.nativeEvent.isComposing) return // U51: 조합 중 Enter는 확정용이다.
      onEditCommit()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onEditCancel()
    }
  }

  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`${todo.title} 완료`}
      />
      {/*
        U15: textContent는 제목과 정확히 같아야 한다. 장식 문자를 넣지 않는다.
        U45: 편집 중에도 DOM에 남기고 hidden으로만 감춘다. 확정 전까지 원래 제목이다.
        U57: 편집은 더블클릭에서만 시작한다. 한 번 클릭에는 핸들러가 없다.
      */}
      <span
        data-testid="todo-title"
        hidden={editing}
        onDoubleClick={() => onEditStart(todo.id)} // U58: 완료 여부와 무관하다.
      >
        {todo.title}
      </span>
      {/* U41: 편집 중인 항목에만 존재한다. 미리 렌더해 두고 숨기지 않는다. */}
      {editing && (
        <input
          ref={editRef}
          data-testid="todo-edit"
          type="text"
          value={editDraft} // U43: 시작 값은 현재 제목이다.
          onChange={(event) => onEditChange(event.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={onEditCancel} // U52: Enter가 아닌 종료는 전부 취소다.
          aria-label={`${todo.title} 제목 편집`}
        />
      )}
      <button
        data-testid="todo-delete"
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`${todo.title} 삭제`}
      >
        삭제
      </button>
    </li>
  )
}
