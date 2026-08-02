export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type Filter = 'all' | 'active' | 'completed';

/** 입력값을 제목으로 정규화한다. 항목으로 만들 수 없으면 null. (U5, U6) */
export function normalizeTitle(raw: string): string | null {
  const title = raw.trim();
  return title.length > 0 ? title : null;
}

/** 새 항목은 맨 뒤에 붙는다. (U8) */
export function addTodo(todos: readonly Todo[], id: string, title: string): Todo[] {
  return [...todos, { id, title, completed: false }];
}

/** 대상 항목의 완료 여부만 반전한다. 순서와 다른 항목은 그대로. (U12) */
export function toggleTodo(todos: readonly Todo[], id: string): Todo[] {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
}

/** 대상 항목만 제거한다. 나머지 순서는 유지. (U14) */
export function removeTodo(todos: readonly Todo[], id: string): Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

/** 필터에 맞는 항목만 남긴다. (U21, U22, U23) */
export function selectVisible(todos: readonly Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    case 'all':
      return [...todos];
  }
}

/** 필터와 무관하게 전체 목록의 미완료 개수. (U17) */
export function countActive(todos: readonly Todo[]): number {
  return todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0);
}
