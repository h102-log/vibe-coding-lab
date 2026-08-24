// EV1 근거: 항목을 1건 추가한다.
export function addItem<T>(items: readonly T[], item: T): T[] {
  return [...items, item];
}
