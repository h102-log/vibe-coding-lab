import { useState } from "react";
import FilterBar from "./todo/FilterBar";
import TodoInput from "./todo/TodoInput";
import TodoItem from "./todo/TodoItem";
import { visibleTodos } from "./todo/filter";
import type { Filter } from "./todo/types";
import { useTodos } from "./todo/useTodos";

export default function App() {
  const { todos, add, toggle, remove, rename } = useTodos();
  const [filter, setFilter] = useState<Filter>("all");
  // 편집 중인 항목은 최대 1개 (SPEC E-04). 저장하지 않는 화면 상태다 (SPEC E-31).
  const [editingId, setEditingId] = useState<number | null>(null);

  const visible = visibleTodos(todos, filter);
  const activeCount = todos.filter((todo) => !todo.completed).length;

  const commitEdit = (id: number, title: string) => {
    rename(id, title);
    setEditingId(null);
  };

  const deleteTodo = (id: number) => {
    remove(id);
    // 편집 중이던 항목이 사라지면 편집 상태도 끝난다 (SPEC E-28).
    setEditingId((current) => (current === id ? null : current));
  };

  return (
    <main>
      <h1>할 일</h1>
      <TodoInput onAdd={add} />
      <ul>
        {visible.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            editing={todo.id === editingId}
            onToggle={toggle}
            onDelete={deleteTodo}
            onStartEdit={setEditingId}
            onCommitEdit={commitEdit}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}
      </ul>
      <p>
        미완료 <span data-testid="todo-count">{activeCount}</span>
      </p>
      <FilterBar current={filter} onChange={setFilter} />
    </main>
  );
}
