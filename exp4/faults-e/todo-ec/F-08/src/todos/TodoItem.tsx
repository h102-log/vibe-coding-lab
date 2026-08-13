import type { Todo } from './model';

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

// U32: toggle·title·delete는 모두 이 todo-item 요소 안에 있다.
export default function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li data-testid="todo-item">
      <input
        data-testid="todo-toggle"
        type="checkbox"
        checked={todo.done}
        aria-label={`${todo.title} 완료`}
        onChange={() => onToggle(todo.id)}
      />
      {/* U12: 완료 여부와 무관하게 텍스트는 제목 그대로다. */}
      <span data-testid="todo-title">{todo.title}</span>
      <button data-testid="todo-delete" type="button" onClick={() => onDelete(todo.id)}>
      </button>
    </li>
  );
}
