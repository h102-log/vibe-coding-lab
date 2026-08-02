import { useState } from "react";
import FilterBar from "./todo/FilterBar";
import TodoInput from "./todo/TodoInput";
import TodoItem from "./todo/TodoItem";
import { visibleTodos } from "./todo/filter";
import type { Filter } from "./todo/types";
import { useTodos } from "./todo/useTodos";

export default function App() {
  const { todos, add, toggle, remove } = useTodos();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = visibleTodos(todos, filter);
  const activeCount = todos.filter((todo) => !todo.completed).length;

  return (
    <main>
      <h1>할 일</h1>
      <TodoInput onAdd={add} />
      <ul>
        {visible.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggle}
            onDelete={remove}
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
