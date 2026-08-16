/**
 * 지키는 요구 (SPEC.md §1, §2):
 * - S8 "수량이 0이 된 항목은 더 이상 담긴 항목이 아니다 — 목록에 그 줄이 렌더되지 않고, 전체
 *   합계에도 포함되지 않는다."
 * - I1 "수량이 0이 되는 순간 그 줄은 DOM에서 사라지고, 되돌리는 수단(실행 취소·복구)은 제공하지
 *   않는다." (SPEC.md §2.3 U1 — 기본값, 상태 `선택 대기`)
 * - I3 "수량은 0 미만이 될 수 없고 상한은 없다."
 * - I7 "담긴 항목이 0개면 목록 대신 '담은 항목이 없습니다.' 안내를 렌더하고, 전체 합계는 계속
 *   표시하되 0원이다."
 */
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartList, { type CartItem } from './CartList';

afterEach(cleanup);

const FIXTURE: CartItem[] = [
  { id: 'a', name: '사과', unitPrice: 1000, quantity: 1 },
  { id: 'b', name: '원두', unitPrice: 2500, quantity: 2 },
];

/** 소계와 값이 같아질 수 있으므로 합계는 합계 줄에서 직접 읽는다 */
function totalText(): string {
  const total = screen.getByText('합계').closest('p');
  if (total === null) throw new Error('합계 줄을 찾지 못했다');
  return total.querySelector('strong')?.textContent ?? '';
}

describe('수량 0 = 담긴 항목이 아님', () => {
  test('수량 1에서 − 를 누르면 그 줄이 사라지고 합계에서 빠진다 (S8)', async () => {
    const user = userEvent.setup();
    render(<CartList items={FIXTURE} />);

    expect(totalText()).toBe('6,000원'); // 1 × 1,000 + 2 × 2,500

    await user.click(screen.getByRole('button', { name: '사과 수량 줄이기' }));

    expect(screen.queryByText('사과')).toBeNull();
    expect(screen.queryByRole('button', { name: '사과 수량 줄이기' })).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(totalText()).toBe('5,000원'); // 원두 2 × 2,500 만 남는다
  });

  test('사라진 줄은 0으로도 남지 않고 되돌리는 수단도 없다 (I1, I3)', async () => {
    const user = userEvent.setup();
    render(<CartList items={FIXTURE} />);

    await user.click(screen.getByRole('button', { name: '사과 수량 줄이기' }));

    const remaining = screen.getAllByRole('listitem');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].textContent).toContain('원두');
    // 수량 0짜리 줄도, 복구 버튼도 없다 — 남은 줄의 버튼은 원두 것 두 개뿐이다
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('모든 줄이 사라지면 빈 안내와 합계 0원을 보여준다 (I7)', async () => {
    const user = userEvent.setup();
    render(<CartList items={FIXTURE} />);

    await user.click(screen.getByRole('button', { name: '사과 수량 줄이기' }));
    await user.click(screen.getByRole('button', { name: '원두 수량 줄이기' }));
    await user.click(screen.getByRole('button', { name: '원두 수량 줄이기' }));

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('담은 항목이 없습니다.')).toBeTruthy();
    expect(totalText()).toBe('0원');
  });
});
