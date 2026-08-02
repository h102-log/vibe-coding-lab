import FilterBar from './todo/FilterBar';
import TodoCount from './todo/TodoCount';
import TodoInput from './todo/TodoInput';
import TodoList from './todo/TodoList';
import { useTodos } from './todo/useTodos';

export default function App() {
  const {
    todos,
    filter,
    activeCount,
    editingId,
    addTodo,
    toggleTodo,
    removeTodo,
    setFilter,
    startEditing,
    commitEditing,
    cancelEditing,
  } = useTodos();

  return (
    <main>
      <h1>할 일</h1>
      <TodoInput onAdd={addTodo} />
      <TodoList
        todos={todos}
        filter={filter}
        editingId={editingId}
        onToggle={toggleTodo}
        onDelete={removeTodo}
        onStartEdit={startEditing}
        onCommitEdit={commitEditing}
        onCancelEdit={cancelEditing}
      />
      <TodoCount count={activeCount} />
      <FilterBar filter={filter} onChange={setFilter} />
    </main>
  );
}
