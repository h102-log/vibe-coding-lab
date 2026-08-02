import { useEffect, useState } from "react";
import TodoFilters from "./todo/TodoFilters";
import TodoInput from "./todo/TodoInput";
import TodoList from "./todo/TodoList";
import TodoStatusBar from "./todo/TodoStatusBar";
import {
  addTodo,
  cancelEdit,
  changeEditDraft,
  commitEdit,
  countActive,
  createInitialState,
  deleteTodo,
  selectVisible,
  setFilter,
  startEdit,
  toggleTodo,
} from "./todo/todoState";
import { saveTodos } from "./todo/storage";
import type { Filter } from "./todo/types";

export default function App() {
  const [state, setState] = useState(createInitialState);

  // 목록이 바뀔 때마다 저장한다. 필터·편집 상태는 화면 상태일 뿐이라 저장하지 않는다. (SPEC U-34, U-67)
  useEffect(() => {
    saveTodos(state.todos);
  }, [state.todos]);

  const handleAdd = (title: string) => setState((prev) => addTodo(prev, title));
  const handleToggle = (id: number) =>
    setState((prev) => toggleTodo(prev, id));
  const handleDelete = (id: number) =>
    setState((prev) => deleteTodo(prev, id));
  const handleFilter = (filter: Filter) =>
    setState((prev) => setFilter(prev, filter));

  // 편집: 열기 → 초안 수정 → Enter 확정 / Escape 취소 (SPEC S-20~S-22)
  const handleStartEdit = (id: number) => setState((prev) => startEdit(prev, id));
  const handleEditChange = (draft: string) =>
    setState((prev) => changeEditDraft(prev, draft));
  const handleEditCommit = () => setState(commitEdit);
  const handleEditCancel = () => setState(cancelEdit);

  const visibleTodos = selectVisible(state.todos, state.filter);
  const activeCount = countActive(state.todos); // 필터와 무관하게 전체 기준 (SPEC U-32)

  return (
    <main>
      <h1>할 일 목록</h1>
      <TodoInput onAdd={handleAdd} />
      <TodoStatusBar activeCount={activeCount} />
      <TodoFilters filter={state.filter} onChange={handleFilter} />
      <TodoList
        todos={visibleTodos}
        editing={state.editing}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onStartEdit={handleStartEdit}
        onEditChange={handleEditChange}
        onEditCommit={handleEditCommit}
        onEditCancel={handleEditCancel}
      />
    </main>
  );
}
