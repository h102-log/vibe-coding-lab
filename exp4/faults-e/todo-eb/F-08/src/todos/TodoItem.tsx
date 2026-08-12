import type { Todo } from './types';

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`${todo.title} 완료`}
      />
      {/* 제목 외의 문자열은 넣지 않는다(SPEC U-11). */}
      <span data-testid="todo-title">{todo.title}</span>
      <button
        type="button"
        data-testid="todo-delete"
        onClick={() => onDelete(todo.id)}
      >
      </button>
    </li>
  );
}
