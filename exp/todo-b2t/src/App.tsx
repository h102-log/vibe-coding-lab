import FilterBar from './todo/FilterBar';
import TodoInput from './todo/TodoInput';
import TodoList from './todo/TodoList';
import { useTodos } from './todo/useTodos';

export default function App() {
  const { visibleTodos, remainingCount, filter, setFilter, add, toggle, remove } = useTodos();

  return (
    <main>
      <h1>할 일</h1>
      <TodoInput onAdd={add} />
      <TodoList todos={visibleTodos} onToggle={toggle} onDelete={remove} />
      <footer>
        <span data-testid="todo-count">{remainingCount}</span>
        <FilterBar filter={filter} onChange={setFilter} />
      </footer>
    </main>
  );
}
