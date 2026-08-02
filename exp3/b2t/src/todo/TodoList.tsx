import TodoItem from './TodoItem';
import type { Todo } from './types';

type Props = {
  todos: Todo[];
  editingId: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onBeginEdit: (id: string) => void;
  onCommitEdit: (id: string, title: string) => void;
  onCancelEdit: () => void;
};

export default function TodoList({
  todos,
  editingId,
  onToggle,
  onDelete,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
}: Props) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          editing={todo.id === editingId}
          onToggle={onToggle}
          onDelete={onDelete}
          onBeginEdit={onBeginEdit}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
        />
      ))}
    </ul>
  );
}
