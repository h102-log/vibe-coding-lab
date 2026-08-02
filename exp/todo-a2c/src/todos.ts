export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type Filter = 'all' | 'active' | 'completed';

let seq = 0;

export function createTodo(title: string): Todo {
  seq += 1;
  const suffix = Math.random().toString(36).slice(2, 8);
  return { id: `todo-${seq}-${suffix}`, title, completed: false };
}

export function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    default:
      return todos;
  }
}

export function activeCount(todos: Todo[]): number {
  return todos.filter((todo) => !todo.completed).length;
}
