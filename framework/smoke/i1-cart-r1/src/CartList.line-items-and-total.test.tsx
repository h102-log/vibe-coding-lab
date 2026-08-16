/**
 * 지키는 요구 (SPEC.md §1):
 * - S2 "담긴 항목이 하나 이상이면 CartList는 각 항목을 한 줄로 렌더하고, 그 줄은 항목 이름 ·
 *   단가 · 수량 · 소계 네 값을 모두 표시한다."
 * - S3 "각 줄의 소계는 그 줄의 `수량 × 단가`와 같다."
 * - S9 "목록 아래에 전체 합계가 표시되고, 그 값은 담긴 모든 줄의 소계 합과 같다."
 * - S10 "시작 데이터는 CartList 모듈 안에 하드코딩된 항목 2~3개다."
 * - I8 "금액은 정수 원화이고, 천 단위 쉼표 + `원` 접미사로 표시한다. 표시 포맷은 실행 환경의
 *   로케일·ICU 설정에 의존하지 않는다."
 */
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import CartList, { type CartItem } from './CartList';
import { formatWon } from './formatWon';

afterEach(cleanup);

const FIXTURE: CartItem[] = [
  { id: 'a', name: '사과', unitPrice: 1000, quantity: 2 },
  { id: 'b', name: '원두', unitPrice: 2500, quantity: 1 },
];

describe('줄 구성과 합계', () => {
  test('담긴 항목마다 한 줄이 있고 이름·단가·수량·소계를 모두 보여준다 (S2, S3)', () => {
    render(<CartList items={FIXTURE} />);

    const lines = screen.getAllByRole('listitem');
    expect(lines).toHaveLength(2);

    expect(lines[0].textContent).toContain('사과');
    expect(lines[0].textContent).toContain('1,000원'); // 단가
    expect(within(lines[0]).getByText('2')).toBeTruthy(); // 수량
    expect(lines[0].textContent).toContain('2,000원'); // 소계 = 2 × 1,000

    expect(lines[1].textContent).toContain('원두');
    expect(lines[1].textContent).toContain('2,500원'); // 단가이자 소계 = 1 × 2,500
    expect(within(lines[1]).getByText('1')).toBeTruthy();
  });

  test('전체 합계는 모든 줄 소계의 합이고 목록 뒤에 온다 (S9)', () => {
    const { container } = render(<CartList items={FIXTURE} />);

    // 2 × 1,000 + 1 × 2,500
    expect(screen.getByText('4,500원').textContent).toBe('4,500원');

    const list = container.querySelector('ul');
    const total = container.querySelector('.cart-total');
    expect(list).not.toBeNull();
    expect(total).not.toBeNull();
    // 합계가 목록보다 뒤에 있다 = 문서 순서상 list가 total보다 앞
    expect(
      list!.compareDocumentPosition(total!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test('props 없이 렌더하면 하드코딩된 시작 항목 2~3개가 나온다 (S10)', () => {
    render(<CartList />);

    const lines = screen.getAllByRole('listitem');
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.length).toBeLessThanOrEqual(3);
    for (const line of lines) {
      expect(within(line).getAllByRole('button')).toHaveLength(2);
    }
  });

  test('금액 표기는 천 단위 쉼표 + 원이고 로케일에 의존하지 않는다 (I8)', () => {
    expect(formatWon(0)).toBe('0원');
    expect(formatWon(999)).toBe('999원');
    expect(formatWon(1000)).toBe('1,000원');
    expect(formatWon(1234567)).toBe('1,234,567원');
  });
});
