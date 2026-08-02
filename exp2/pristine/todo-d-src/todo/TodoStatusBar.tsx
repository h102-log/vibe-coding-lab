type TodoStatusBarProps = {
  activeCount: number;
};

export default function TodoStatusBar({ activeCount }: TodoStatusBarProps) {
  // todo-count 요소 안에는 숫자만 넣는다. 설명 문구는 바깥 형제 노드에 둔다. (SPEC U-30)
  return (
    <p>
      <span data-testid="todo-count">{activeCount}</span>
      <span>개 남음</span>
    </p>
  );
}
