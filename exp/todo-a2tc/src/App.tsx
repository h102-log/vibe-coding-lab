import { useState } from 'react';
import type { FormEvent } from 'react';
import TodoFilters from './todo/TodoFilters.tsx';
import TodoItem from './todo/TodoItem.tsx';
import { useTodos } from './todo/useTodos.ts';

export default function App() {
  const {
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    removeTodo,
    visibleTodos,
    activeCount,
  } = useTodos();
  const [draft, setDraft] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addTodo(draft)) {
      setDraft('');
    }
  };

  return (
    <main>
      <h1>할 일</h1>

      <form onSubmit={handleSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          value={draft}
          placeholder="할 일을 입력하세요"
          aria-label="할 일 입력"
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>

      <ul>
        {visibleTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onRemove={removeTodo}
          />
        ))}
      </ul>

      <p>
        남은 할 일 <span data-testid="todo-count">{activeCount}</span>개
      </p>

      <TodoFilters filter={filter} onChange={setFilter} />
    </main>
  );
}
