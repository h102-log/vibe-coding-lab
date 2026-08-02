type Props = {
  count: number;
};

/** U20/U21/U40: 항상 존재하고, 미완료 개수 외의 숫자를 담지 않으며, 텍스트를 쪼개지 않는다. */
export function TodoCount({ count }: Props) {
  return <span data-testid="todo-count">{`${count}개 남음`}</span>;
}
