import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.tsx';

/**
 * SPEC.md §4 — 자체 검증.
 * 인수 테스트가 검사하지 않을 수도 있는 §2 문장들을 여기서 지킨다.
 * 각 test 이름 뒤의 U번호가 그 케이스가 지키는 SPEC.md §2 문장이다.
 *
 * 실행: npx vitest run --config vitest.impl.config.ts
 */

const user = userEvent.setup();

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function input() {
  return screen.getByTestId('todo-input') as HTMLInputElement;
}

function titles() {
  return screen.queryAllByTestId('todo-title').map((el) => el.textContent);
}

function items() {
  return screen.queryAllByTestId('todo-item');
}

function toggleOf(i: number) {
  return within(items()[i]).getByTestId('todo-toggle') as HTMLInputElement;
}

function deleteOf(i: number) {
  return within(items()[i]).getByTestId('todo-delete');
}

function countText() {
  return screen.getByTestId('todo-count').textContent ?? '';
}

async function add(title: string) {
  await user.type(input(), `${title}{Enter}`);
}

describe('추가', () => {
  test('U4 — 공백만 입력하면 항목이 늘지 않고 입력값도 그대로 남는다', async () => {
    render(<App />);
    await user.type(input(), '   {Enter}');
    expect(items()).toHaveLength(0);
    expect(input().value).toBe('   ');

    await user.clear(input());
    await user.type(input(), '{Enter}');
    expect(items()).toHaveLength(0);
  });

  test('U5 — 앞뒤 공백은 제거되어 저장된다', async () => {
    render(<App />);
    await add('  우유 사기  ');
    expect(titles()).toEqual(['우유 사기']);
  });

  test('U3 — 추가에 성공하면 입력창이 비워진다', async () => {
    render(<App />);
    await add('A');
    expect(input().value).toBe('');
  });

  test('U10 — 새 항목은 맨 뒤에 붙고 기존 순서는 유지된다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    expect(titles()).toEqual(['A', 'B', 'C']);
  });

  test('U11/U12 — 새 항목은 미완료이고, 같은 제목도 중복 추가된다', async () => {
    render(<App />);
    await add('같은 제목');
    await add('같은 제목');
    expect(items()).toHaveLength(2);
    expect(toggleOf(0).checked).toBe(false);
    expect(toggleOf(1).checked).toBe(false);
  });
});

describe('토글·삭제', () => {
  test('U13/U15 — 제목이 같아도 토글한 항목만 상태가 바뀐다', async () => {
    render(<App />);
    await add('같은 제목');
    await add('같은 제목');
    await user.click(toggleOf(0));
    expect(toggleOf(0).checked).toBe(true);
    expect(toggleOf(1).checked).toBe(false);

    await user.click(toggleOf(0));
    expect(toggleOf(0).checked).toBe(false);
  });

  test('U16 — 삭제 버튼 클릭이 form submit을 유발하지 않는다', async () => {
    render(<App />);
    await add('A');
    await user.type(input(), '아직 확정 안 한 값');
    await user.click(deleteOf(0));
    expect(titles()).toEqual([]);
    expect(input().value).toBe('아직 확정 안 한 값');
  });

  test('U17 — 가운데 항목을 지워도 나머지 순서는 유지된다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    await user.click(deleteOf(1));
    expect(titles()).toEqual(['A', 'C']);
  });

  test('U42 — 마지막 항목을 지우면 목록이 비고 카운트는 0이 된다', async () => {
    render(<App />);
    await add('A');
    await user.click(deleteOf(0));
    expect(items()).toHaveLength(0);
    expect(countText()).toContain('0');
  });
});

describe('카운트', () => {
  test('U20/U21 — 항목이 0개여도 존재하며 0을 표시한다', () => {
    render(<App />);
    expect(screen.getByTestId('todo-count')).toBeTruthy();
    expect(countText()).toContain('0');
  });

  test('U19 — 필터가 걸려도 전체 미완료 개수를 센다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    await user.click(toggleOf(0));
    expect(countText()).toContain('2');

    await user.click(screen.getByTestId('filter-completed'));
    expect(items()).toHaveLength(1);
    expect(countText()).toContain('2'); // 보이는 건 1개지만 미완료는 2개다.
  });
});

describe('필터', () => {
  test('U23~U26 — 제외된 항목은 감춰지는 게 아니라 DOM에서 빠진다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggleOf(0));

    await user.click(screen.getByTestId('filter-active'));
    expect(titles()).toEqual(['B']);

    await user.click(screen.getByTestId('filter-completed'));
    expect(titles()).toEqual(['A']);

    await user.click(screen.getByTestId('filter-all'));
    expect(titles()).toEqual(['A', 'B']);
  });

  test('U22/U30 — 초기 필터는 all이고 선택된 버튼만 aria-pressed=true다', async () => {
    render(<App />);
    expect(screen.getByTestId('filter-all').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('filter-active').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('filter-completed').getAttribute('aria-pressed')).toBe('false');

    await user.click(screen.getByTestId('filter-active'));
    expect(screen.getByTestId('filter-all').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('filter-active').getAttribute('aria-pressed')).toBe('true');
  });

  test('U27/U28 — 필터 상태에서 토글하면 항목이 목록에서 빠지고 필터는 유지된다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(screen.getByTestId('filter-active'));
    expect(titles()).toEqual(['A', 'B']);

    await user.click(toggleOf(0));
    expect(titles()).toEqual(['B']);
    expect(screen.getByTestId('filter-active').getAttribute('aria-pressed')).toBe('true');
  });

  test('U29 — completed 필터에서 추가한 항목은 안 보이지만 목록에는 들어간다', async () => {
    render(<App />);
    await user.click(screen.getByTestId('filter-completed'));
    await add('A');
    expect(items()).toHaveLength(0);
    expect(countText()).toContain('1');

    await user.click(screen.getByTestId('filter-all'));
    expect(titles()).toEqual(['A']);
  });
});

describe('영속성', () => {
  test('U31 — 다시 마운트해도 목록과 완료 상태가 복원된다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggleOf(0));

    cleanup();
    render(<App />);
    expect(titles()).toEqual(['A', 'B']);
    expect(toggleOf(0).checked).toBe(true);
    expect(toggleOf(1).checked).toBe(false);
    expect(countText()).toContain('1');
  });

  test('U34 — 복원 후 추가한 항목의 id가 기존 항목과 겹치지 않는다', async () => {
    render(<App />);
    await add('A');
    await add('B');

    cleanup();
    render(<App />);
    await add('C');
    await user.click(toggleOf(2));
    expect(titles()).toEqual(['A', 'B', 'C']);
    expect(toggleOf(0).checked).toBe(false);
    expect(toggleOf(1).checked).toBe(false);
    expect(toggleOf(2).checked).toBe(true); // id가 겹쳤다면 A나 B가 함께 켜졌을 것.
  });

  test('U33 — 저장된 값이 깨져 있으면 빈 목록으로 시작한다', () => {
    localStorage.setItem('todo-dc.todos', '{ 이건 JSON 이 아니다');
    render(<App />);
    expect(items()).toHaveLength(0);
    expect(countText()).toContain('0');
  });
});

describe('불변식', () => {
  test('U41 — 추가·토글·삭제·필터를 섞어도 카운트와 목록이 어긋나지 않는다', async () => {
    render(<App />);
    await add('A');
    await user.click(screen.getByTestId('filter-active'));
    await add('B');
    await user.click(toggleOf(0));
    await user.click(screen.getByTestId('filter-all'));
    await add('C');
    await user.click(deleteOf(1));
    await user.click(screen.getByTestId('filter-completed'));
    await user.click(screen.getByTestId('filter-all'));

    // 남은 것: A(완료), C(미완료)
    expect(titles()).toEqual(['A', 'C']);
    const activeInDom = items().filter((_, i) => !toggleOf(i).checked).length;
    expect(countText()).toContain(String(activeInDom));
    expect(activeInDom).toBe(1);
  });

  test('U8/U9/U40 — 각 항목 안에 toggle/title/delete가 하나씩 있고 제목은 정확히 일치한다', async () => {
    render(<App />);
    await add('정확한 제목');
    const item = items()[0];
    expect(within(item).getAllByTestId('todo-toggle')).toHaveLength(1);
    expect(within(item).getAllByTestId('todo-title')).toHaveLength(1);
    expect(within(item).getAllByTestId('todo-delete')).toHaveLength(1);
    expect(within(item).getByTestId('todo-title').textContent).toBe('정확한 제목');
  });
});
