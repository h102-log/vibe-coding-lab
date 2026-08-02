import type { Filter, Todo } from './types.ts';

/** U23~U26: 필터에서 제외된 항목은 감추는 게 아니라 목록에서 빠진다. */
export function selectByFilter(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'all':
      return todos;
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
  }
}
