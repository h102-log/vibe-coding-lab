import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartList from './CartList';

afterEach(cleanup);

/** 이름으로 그 항목의 줄(<li>)을 찾는다. */
function row(name: string) {
  const found = screen
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(name));
  if (!found) throw new Error(`"${name}" 줄이 목록에 없다`);
  return found;
}

function rowNames() {
  return screen
    .queryAllByRole('listitem')
    .map((li) => li.querySelector('.cart-name')?.textContent ?? '');
}

/** 목록 아래 전체 합계 문단. */
function totalText() {
  return screen.getByText('전체 합계').parentElement?.textContent ?? '';
}

describe('CartList', () => {
  // S2: 각 줄에 이름·단가·수량·소계
  it('각 줄에 이름·단가·수량·소계를 보여준다', () => {
    render(<CartList />);

    const latte = row('카페라떼');
    expect(latte.querySelector('.cart-name')?.textContent).toBe('카페라떼');
    expect(latte.querySelector('.cart-unit-price')?.textContent).toContain('5,000');
    expect(latte.querySelector('.cart-quantity')?.textContent).toBe('1개');
    expect(latte.querySelector('.cart-subtotal')?.textContent).toContain('5,000');

    // 수량 2 × 4,500 = 9,000
    const americano = row('아메리카노');
    expect(americano.querySelector('.cart-quantity')?.textContent).toBe('2개');
    expect(americano.querySelector('.cart-subtotal')?.textContent).toContain('9,000');
  });

  // S3 + I1: 스테퍼 버튼은 아이콘만 있어도 접근 가능한 이름으로 찾힌다
  it('각 줄에 접근 가능한 이름을 가진 −/+ 버튼이 있다', () => {
    render(<CartList />);

    const americano = row('아메리카노');
    expect(
      within(americano).getByRole('button', { name: '아메리카노 수량 줄이기' }),
    ).toBeTruthy();
    expect(
      within(americano).getByRole('button', { name: '아메리카노 수량 늘리기' }),
    ).toBeTruthy();
  });

  // S5: + 는 그 줄만 1 올린다 — 다른 줄은 그대로
  it('+ 를 누르면 그 줄의 수량만 1 오르고 소계·합계가 따라 오른다', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    // 시작 합계: 4500*2 + 5000*1 + 3800*3 = 25,400
    expect(totalText()).toContain('25,400');

    await user.click(
      screen.getByRole('button', { name: '카페라떼 수량 늘리기' }),
    );

    const latte = row('카페라떼');
    expect(latte.querySelector('.cart-quantity')?.textContent).toBe('2개');
    expect(latte.querySelector('.cart-subtotal')?.textContent).toContain('10,000');

    // 다른 줄은 그대로
    expect(row('아메리카노').querySelector('.cart-quantity')?.textContent).toBe('2개');
    expect(row('버터 스콘').querySelector('.cart-quantity')?.textContent).toBe('3개');

    // 합계 25,400 + 5,000 = 30,400
    expect(totalText()).toContain('30,400');
  });

  // S6: − 는 그 줄만 1 내린다
  it('− 를 누르면 그 줄의 수량만 1 내리고 소계·합계가 따라 내린다', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    await user.click(
      screen.getByRole('button', { name: '버터 스콘 수량 줄이기' }),
    );

    const scone = row('버터 스콘');
    expect(scone.querySelector('.cart-quantity')?.textContent).toBe('2개');
    expect(scone.querySelector('.cart-subtotal')?.textContent).toContain('7,600');

    expect(row('아메리카노').querySelector('.cart-quantity')?.textContent).toBe('2개');

    // 25,400 − 3,800 = 21,600
    expect(totalText()).toContain('21,600');
  });

  // S7 + S7a: 수량 0 → 줄 제거 + 합계에서 제외
  it('수량이 0이 되면 그 줄은 목록에서 빠지고 합계에도 들어가지 않는다', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    // 카페라떼는 수량 1 — 한 번 누르면 0
    await user.click(
      screen.getByRole('button', { name: '카페라떼 수량 줄이기' }),
    );

    expect(rowNames()).toEqual(['아메리카노', '버터 스콘']);
    expect(screen.queryByRole('button', { name: '카페라떼 수량 늘리기' })).toBeNull();

    // 25,400 − 5,000 = 20,400
    expect(totalText()).toContain('20,400');
  });

  // I7: 전부 빠지면 안내 문구 + 합계 ₩0
  it('모든 항목이 빠지면 빈 안내를 보이고 합계는 0이 된다', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    for (const [name, times] of [
      ['아메리카노', 2],
      ['카페라떼', 1],
      ['버터 스콘', 3],
    ] as const) {
      for (let i = 0; i < times; i++) {
        await user.click(
          screen.getByRole('button', { name: `${name} 수량 줄이기` }),
        );
      }
    }

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('담은 항목이 없습니다.')).toBeTruthy();
    expect(totalText()).toContain('0');
    expect(totalText()).not.toContain(',');
  });
});
