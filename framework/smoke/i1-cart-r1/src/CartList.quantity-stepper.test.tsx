/**
 * 지키는 요구 (SPEC.md §1, §2):
 * - S4 "각 줄에는 수량 스테퍼가 있다 — 아이콘(기호)만 보이는 작은 버튼 두 개(−, +)이며, 버튼
 *   안에 보이는 텍스트 라벨은 없다."
 * - S5 "어떤 줄의 + 버튼을 누르면 그 줄의 수량이 정확히 1 증가한다."
 * - S6 "어떤 줄의 − 버튼을 누르면 그 줄의 수량이 정확히 1 감소한다."
 * - S7 "한 줄의 수량을 바꿔도 다른 줄의 수량은 변하지 않는다."
 * - I4 "두 아이콘 버튼은 각각 `"<항목 이름> 수량 줄이기"` · `"<항목 이름> 수량 늘리기"`를 접근
 *   가능한 이름으로 갖고, 안의 기호 문자는 보조기술에서 숨긴다."
 * - I5 "두 버튼은 네이티브 `<button type="button">`이라 Tab만으로 도달하고 Enter·Space로
 *   활성화되며, 커스텀 `tabIndex`를 두지 않아 Tab 순서가 시각적 순서와 같다."
 */
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartList, { type CartItem } from './CartList';

afterEach(cleanup);

const FIXTURE: CartItem[] = [
  { id: 'a', name: '사과', unitPrice: 1000, quantity: 2 },
  { id: 'b', name: '원두', unitPrice: 2500, quantity: 4 },
];

function quantityOf(name: string): string {
  const line = screen.getByText(name).closest('li');
  if (line === null) throw new Error(`${name} 줄을 찾지 못했다`);
  return within(line).getByRole('group').textContent?.replace(/[−+]/g, '') ?? '';
}

describe('수량 스테퍼', () => {
  test('+ 를 누르면 그 줄의 수량과 소계·합계가 1개분 오른다 (S5)', async () => {
    const user = userEvent.setup();
    render(<CartList items={FIXTURE} />);

    await user.click(screen.getByRole('button', { name: '사과 수량 늘리기' }));

    expect(quantityOf('사과')).toBe('3');
    expect(screen.getByText('사과').closest('li')!.textContent).toContain('3,000원'); // 소계
    expect(screen.getByText('13,000원')).toBeTruthy(); // 3 × 1,000 + 4 × 2,500
  });

  test('− 를 누르면 그 줄의 수량과 소계·합계가 1개분 내린다 (S6)', async () => {
    const user = userEvent.setup();
    render(<CartList items={FIXTURE} />);

    await user.click(screen.getByRole('button', { name: '사과 수량 줄이기' }));

    expect(quantityOf('사과')).toBe('1');
    expect(screen.getByText('사과').closest('li')!.textContent).toContain('1,000원'); // 소계
    expect(screen.getByText('11,000원')).toBeTruthy(); // 1 × 1,000 + 4 × 2,500
  });

  test('한 줄을 조작해도 다른 줄의 수량은 그대로다 (S7)', async () => {
    const user = userEvent.setup();
    render(<CartList items={FIXTURE} />);

    await user.click(screen.getByRole('button', { name: '사과 수량 늘리기' }));
    await user.click(screen.getByRole('button', { name: '사과 수량 늘리기' }));

    expect(quantityOf('사과')).toBe('4');
    expect(quantityOf('원두')).toBe('4');
  });

  test('스테퍼 버튼은 기호만 보이고 접근 가능한 이름은 항목별로 다르다 (S4, I4)', () => {
    render(<CartList items={FIXTURE} />);

    const decrease = screen.getByRole('button', { name: '사과 수량 줄이기' });
    const increase = screen.getByRole('button', { name: '사과 수량 늘리기' });

    // 눈에 보이는 것은 기호 한 글자뿐 — 텍스트 라벨이 없다
    expect(decrease.textContent).toBe('−');
    expect(increase.textContent).toBe('+');
    // 기호는 보조기술에서 숨겨져 있어 이름을 오염시키지 않는다
    expect(decrease.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(increase.querySelector('[aria-hidden="true"]')).not.toBeNull();
    // 항목마다 이름이 구분된다
    expect(screen.getByRole('button', { name: '원두 수량 늘리기' })).not.toBe(increase);
  });

  test('Tab 으로 스테퍼에 도달하고 Enter 로 수량을 바꾼다 (I5)', async () => {
    const user = userEvent.setup();
    render(<CartList items={FIXTURE} />);

    const decrease = screen.getByRole('button', { name: '사과 수량 줄이기' });
    expect(decrease.getAttribute('type')).toBe('button');
    expect(decrease.getAttribute('tabindex')).toBeNull();

    await user.tab(); // 문서의 첫 초점 가능 요소 = 첫 줄의 − 버튼
    expect(document.activeElement).toBe(decrease);

    await user.keyboard('{Enter}');
    expect(quantityOf('사과')).toBe('1');

    await user.tab(); // − 다음 초점은 같은 줄의 + 버튼
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '사과 수량 늘리기' }),
    );
  });
});
