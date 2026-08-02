import { loadTodos } from "./storage";
import type { Filter, Todo, TodoState } from "./types";

/**
 * 목록 상태 전이. createInitialState를 뺀 나머지는 전부 순수 함수다.
 */

export function createInitialState(): TodoState {
  // 저장된 목록을 복원한다. id는 저장값을 그대로 쓰고, 다음 id만 최댓값에서 이어 붙인다. (SPEC U-34, U-13)
  const todos = loadTodos();
  const maxId = todos.reduce((max, todo) => Math.max(max, todo.id), 0);
  return {
    todos,
    filter: "all",
    nextId: maxId + 1,
  };
}

export function addTodo(state: TodoState, rawTitle: string): TodoState {
  const title = rawTitle.trim();
  if (title === "") {
    return state;
  }
  const todo: Todo = { id: state.nextId, title, completed: false };
  return {
    ...state,
    todos: [...state.todos, todo],
    nextId: state.nextId + 1,
  };
}

export function toggleTodo(state: TodoState, _id: number): TodoState {
  // F-03: 앱 상태를 갱신하는 호출을 제거했다.
  return state;
}

export function deleteTodo(state: TodoState, id: number): TodoState {
  return {
    ...state,
    todos: state.todos.filter((todo) => todo.id !== id),
  };
}

export function setFilter(state: TodoState, filter: Filter): TodoState {
  return { ...state, filter };
}

export function selectVisible(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case "all":
      return todos;
    case "active":
      return todos.filter((todo) => !todo.completed);
    case "completed":
      return todos.filter((todo) => todo.completed);
  }
}

export function countActive(todos: Todo[]): number {
  return todos.filter((todo) => !todo.completed).length;
}
