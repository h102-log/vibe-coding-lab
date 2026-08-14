/**
 * @vitest-environment jsdom
 *
 * SPEC.md §1·§2의 문장을 동작으로 확인한다.
 * tsconfig.app.json 의 exclude 가 *.test.* 를 빼므로 `npm run build` 에는 포함되지 않는다.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartList from './CartList';

afterEach(cleanup);

/** 접근 가능한 이름으로 스테퍼 버튼을 집는다 (S12·I8). */
const stepper = (name: string, dir: '감소' | '증가') =>
  screen.getByRole('button', { name: `${name} 수량 ${dir}` });

describe('CartList', () => {
  it('각 줄에 이름·단가·수량·소계를 보여준다 (S3·S4)', () => {
    render(<CartList />);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);

    const apple = rows[0];
    expect(within(apple).getByText('사과')).toBeTruthy();
    expect(within(apple).getByText('단가 1,200원')).toBeTruthy();
    expect(within(apple).getByText('2개')).toBeTruthy();
    expect(within(apple).getByText('소계 2,400원')).toBeTruthy();
  });

  it('목록 아래 전체 합계가 소계의 합이다 (S10·I5)', () => {
    render(<CartList />);
    // 2,400 + 2,500 + 9,600 = 14,500
    expect(screen.getByText('14,500원')).toBeTruthy();
  });

  it('+ 를 누르면 그 줄의 수량이 1 오르고 소계·합계가 따라 오른다 (S7)', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    await user.click(stepper('사과', '증가'));

    const apple = screen.getAllByRole('listitem')[0];
    expect(within(apple).getByText('3개')).toBeTruthy();
    expect(within(apple).getByText('소계 3,600원')).toBeTruthy();
    expect(screen.getByText('15,700원')).toBeTruthy();
  });

  it('− 를 누르면 그 줄의 수량이 1 내려간다 (S8)', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    await user.click(stepper('식빵', '감소'));

    const bread = screen.getAllByRole('listitem')[2];
    expect(within(bread).getByText('2개')).toBeTruthy();
    expect(within(bread).getByText('소계 6,400원')).toBeTruthy();
  });

  it('수량이 0이 된 줄은 숨김이 아니라 언렌더된다 (S9·I1)', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    await user.click(stepper('우유', '감소')); // 1 → 0

    expect(screen.queryByText('우유')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    // 합계에서도 빠진다: 2,400 + 9,600
    expect(screen.getByText('12,000원')).toBeTruthy();
  });

  it('줄이 하나도 없으면 목록 대신 빈 상태 문구만 렌더한다 (S14·I6)', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    await user.click(stepper('사과', '감소'));
    await user.click(stepper('사과', '감소'));
    await user.click(stepper('우유', '감소'));
    for (let i = 0; i < 3; i += 1) await user.click(stepper('식빵', '감소'));

    expect(screen.getByText('담긴 항목이 없습니다')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText(/전체 합계/)).toBeNull();
  });

  it('− 와 + 는 탭으로 도달하고 키보드로 조작된다 (S13)', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    await user.tab();
    expect(document.activeElement).toBe(stepper('사과', '감소'));

    await user.tab();
    expect(document.activeElement).toBe(stepper('사과', '증가'));

    await user.keyboard('{Enter}'); // 2 → 3
    await user.keyboard(' '); // 3 → 4
    expect(within(screen.getAllByRole('listitem')[0]).getByText('4개')).toBeTruthy();
  });

  it('줄이 제거되면 포커스가 이웃 줄로 옮겨간다 (I9)', async () => {
    const user = userEvent.setup();
    render(<CartList />);

    await user.click(stepper('우유', '감소')); // 우유 줄 제거
    expect(document.activeElement).toBe(stepper('식빵', '감소'));

    for (let i = 0; i < 3; i += 1) await user.click(stepper('식빵', '감소'));
    expect(document.activeElement).toBe(stepper('사과', '감소')); // 이전 줄로

    await user.click(stepper('사과', '감소'));
    await user.click(stepper('사과', '감소'));
    expect(document.activeElement).toBe(screen.getByText('담긴 항목이 없습니다'));
  });
});
