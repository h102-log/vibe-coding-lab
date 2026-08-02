import TodoItem from "./TodoItem";
import type { Editing, Todo } from "./types";

type TodoListProps = {
  todos: Todo[];
  editing: Editing | null;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onStartEdit: (id: number) => void;
  onEditChange: (draft: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
};

export default function TodoList({
  todos,
  editing,
  onToggle,
  onDelete,
  onStartEdit,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: TodoListProps) {
  // 현재 필터에 맞는 항목만 넘겨받는다. 걸러진 항목은 숨기는 게 아니라 DOM에 없다. (SPEC U-23)
  if (todos.length === 0) {
    return <p>표시할 항목이 없습니다.</p>;
  }

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          // 편집 대상은 한 번에 하나뿐이다 → todo-edit도 화면에 하나뿐이다. (SPEC U-48, U-53)
          editDraft={editing !== null && editing.id === todo.id ? editing.draft : null}
          onToggle={onToggle}
          onDelete={onDelete}
          onStartEdit={onStartEdit}
          onEditChange={onEditChange}
          onEditCommit={onEditCommit}
          onEditCancel={onEditCancel}
        />
      ))}
    </ul>
  );
}
