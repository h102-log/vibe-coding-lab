import type { Filter, Todo } from "./types";

export function visibleTodos(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case "all":
      return todos;
    case "active":
      return todos.filter((todo) => !todo.completed);
    case "completed":
      return todos.filter((todo) => todo.completed);
  }
}
