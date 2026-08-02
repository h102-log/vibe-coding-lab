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
    editing: null, // 편집 상태는 저장하지 않는다. (SPEC U-67)
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

export function toggleTodo(state: TodoState, id: number): TodoState {
  return {
    ...state,
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    ),
  };
}

export function deleteTodo(state: TodoState, id: number): TodoState {
  return {
    ...state,
    todos: state.todos.filter((todo) => todo.id !== id),
    // 사라진 항목의 편집 상태를 남기지 않는다. (SPEC U-68)
    editing: state.editing?.id === id ? null : state.editing,
  };
}

export function setFilter(state: TodoState, filter: Filter): TodoState {
  // 필터가 바뀌면 편집은 끝난다. 마우스 클릭 경로에서는 blur가 먼저 일어나 이미 확정된 뒤다. (SPEC U-68)
  return { ...state, filter, editing: null };
}

/**
 * 제목 인라인 편집. 편집 중에는 초안만 바뀌고 todos는 확정 시점에만 바뀐다. (SPEC U-54)
 * commitEdit/cancelEdit는 멱등이다 — 확정·취소 뒤 뒤늦게 들어온 blur가 아무 일도 하지 않는다. (SPEC U-61)
 */

export function startEdit(state: TodoState, id: number): TodoState {
  const target = state.todos.find((todo) => todo.id === id);
  if (target === undefined) {
    return state;
  }
  // 초안의 시작값은 현재 저장된 제목 그대로다. 버려진 이전 초안이 새어 들어오지 않는다. (SPEC U-47, U-60)
  return { ...state, editing: { id, draft: target.title } };
}

export function changeEditDraft(state: TodoState, draft: string): TodoState {
  if (state.editing === null) {
    return state;
  }
  return { ...state, editing: { ...state.editing, draft } };
}

export function commitEdit(state: TodoState): TodoState {
  const { editing } = state;
  if (editing === null) {
    return state;
  }
  const title = editing.draft.trim(); // 추가와 같은 규칙 (SPEC U-57)
  if (title === "") {
    // 빈 제목은 거부한다. 원래 제목을 유지하고 항목을 지우지 않는다. (SPEC U-58)
    return { ...state, editing: null };
  }
  return {
    ...state,
    todos: state.todos.map((todo) =>
      todo.id === editing.id ? { ...todo, title } : todo,
    ),
    editing: null,
  };
}

export function cancelEdit(state: TodoState): TodoState {
  if (state.editing === null) {
    return state;
  }
  return { ...state, editing: null };
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
