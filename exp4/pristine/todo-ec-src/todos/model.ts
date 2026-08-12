export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

export type Filter = 'all' | 'active' | 'completed';

const ID_PREFIX = 'todo-';

/**
 * U34/U41: 지금 목록에 있는 번호 중 가장 큰 것 다음 번호를 쓴다.
 * 저장소에서 복원한 항목도 목록에 들어 있으므로, 새로고침 뒤 첫 항목이
 * 복원된 항목과 같은 id를 받는 일이 없다. 모듈 전역 카운터를 두지 않아
 * 같은 목록에 대해 항상 같은 값이 나온다(updater 안에서 불러도 안전하다).
 */
export function nextIdFor(todos: readonly Todo[]): string {
  let max = 0;
  for (const todo of todos) {
    if (!todo.id.startsWith(ID_PREFIX)) continue;
    const suffix = Number(todo.id.slice(ID_PREFIX.length));
    if (Number.isInteger(suffix) && suffix > max) max = suffix;
  }
  return `${ID_PREFIX}${max + 1}`;
}

/** U5: 새 항목은 목록 맨 뒤에 붙는다. U2/U3: 앞뒤 공백을 떼고, 비면 추가하지 않는다. U6: 미완료로 시작한다. */
export function addTodo(todos: readonly Todo[], rawTitle: string): Todo[] {
  const title = rawTitle.trim();
  if (title === '') return todos as Todo[];
  return [...todos, { id: nextIdFor(todos), title, done: false }];
}

/** U11/U13: 해당 항목의 완료 여부만 뒤집고 위치는 유지한다. */
export function toggleTodo(todos: readonly Todo[], id: string): Todo[] {
  return todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

/** U14: 해당 항목만 빼고 나머지 순서는 유지한다. */
export function removeTodo(todos: readonly Todo[], id: string): Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

/** U20~U24: 필터는 보여줄 대상만 고른다. 원본은 건드리지 않는다. */
export function visibleTodos(todos: readonly Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.done);
    case 'completed':
      return todos.filter((todo) => todo.done);
    case 'all':
      return [...todos];
  }
}

/** U17: 현재 필터와 무관하게 전체 항목 중 미완료 개수를 센다. */
export function activeCount(todos: readonly Todo[]): number {
  return todos.filter((todo) => !todo.done).length;
}
