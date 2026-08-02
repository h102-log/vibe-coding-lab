type Props = {
  count: number;
};

export default function TodoCount({ count }: Props) {
  return <span data-testid="todo-count">{count}개 남음</span>;
}
