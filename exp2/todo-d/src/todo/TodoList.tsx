import TodoItem from "./TodoItem";
import type { Todo } from "./types";

type TodoListProps = {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
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
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
