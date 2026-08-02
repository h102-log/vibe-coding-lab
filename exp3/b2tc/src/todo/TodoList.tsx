import type { Filter, Todo } from './types';
import TodoItem from './TodoItem';

type Props = {
  todos: Todo[];
  filter: Filter;
  editingId: number | null;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onStartEdit: (id: number) => void;
  onCommitEdit: (id: number, title: string) => void;
  onCancelEdit: () => void;
};

// 필터는 원본 배열을 건드리지 않고, 그릴 목록만 좁힌다.
// 숨겨진 항목은 DOM에 남지 않는다.
function visibleTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'active') return todos.filter((todo) => !todo.completed);
  if (filter === 'completed') return todos.filter((todo) => todo.completed);
  return todos;
}

export default function TodoList({
  todos,
  filter,
  editingId,
  onToggle,
  onDelete,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: Props) {
  return (
    <ul>
      {visibleTodos(todos, filter).map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          editing={todo.id === editingId}
          onToggle={onToggle}
          onDelete={onDelete}
          onStartEdit={onStartEdit}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
        />
      ))}
    </ul>
  );
}
