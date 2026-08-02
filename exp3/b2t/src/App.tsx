import FilterBar from './todo/FilterBar';
import TodoInput from './todo/TodoInput';
import TodoList from './todo/TodoList';
import { useTodos } from './todo/useTodos';

export default function App() {
  const {
    visibleTodos,
    remainingCount,
    filter,
    setFilter,
    editingId,
    add,
    toggle,
    remove,
    beginEdit,
    cancelEdit,
    commitEdit,
  } = useTodos();

  return (
    <main>
      <h1>할 일</h1>
      <TodoInput onAdd={add} />
      <TodoList
        todos={visibleTodos}
        editingId={editingId}
        onToggle={toggle}
        onDelete={remove}
        onBeginEdit={beginEdit}
        onCommitEdit={commitEdit}
        onCancelEdit={cancelEdit}
      />
      <footer>
        <span data-testid="todo-count">{remainingCount}</span>
        <FilterBar filter={filter} onChange={setFilter} />
      </footer>
    </main>
  );
}
