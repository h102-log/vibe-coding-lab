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

function titleOf(i: number) {
  return within(items()[i]).getByTestId('todo-title');
}

function edits() {
  return screen.queryAllByTestId('todo-edit') as HTMLInputElement[];
}

function edit() {
  return screen.getByTestId('todo-edit') as HTMLInputElement;
}

async function startEdit(i: number) {
  await user.dblClick(titleOf(i));
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

// ── [CHANGE] 인라인 제목 편집 — SPEC.md §5·§6 ──────────────────────────────
// 인수 테스트는 편집 기능이 없던 코드에서도 8/8 통과했다. 편집 동작을 지키는 것은 아래 케이스뿐이다.

describe('편집 — 진입', () => {
  test('E1/E2/X1/X2/X3 — 제목을 더블클릭하면 그 자리에 todo-edit이 나타나고 포커스를 갖는다', async () => {
    render(<App />);
    await add('A');
    expect(edits()).toHaveLength(0); // X6

    await startEdit(0);
    expect(edits()).toHaveLength(1);
    expect(edit().value).toBe('A'); // X2
    expect(document.activeElement).toBe(edit()); // X3
    expect(within(items()[0]).queryAllByTestId('todo-title')).toHaveLength(0); // X1
    expect(within(items()[0]).getAllByTestId('todo-edit')).toHaveLength(1); // E5
  });

  test('X9 — 편집 중에도 그 항목 안에 toggle/delete가 하나씩 남는다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    const item = items()[0];
    expect(within(item).getAllByTestId('todo-toggle')).toHaveLength(1);
    expect(within(item).getAllByTestId('todo-delete')).toHaveLength(1);
  });

  test('X4 — 캐럿이 끝에 있어 타이핑이 기존 값 뒤에 붙는다(전체 선택 아님)', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    expect(edit().selectionStart).toBe(1);
    await user.keyboard('!');
    expect(edit().value).toBe('A!');
  });

  test('X7 — 한 번 클릭으로는 편집이 시작되지 않는다', async () => {
    render(<App />);
    await add('A');
    await user.click(titleOf(0));
    expect(edits()).toHaveLength(0);
  });

  test('X8/X32 — 제목이 아닌 곳을 더블클릭해도 편집이 시작되지 않는다', async () => {
    render(<App />);
    await add('A');
    await user.dblClick(toggleOf(0));
    expect(edits()).toHaveLength(0);
    expect(toggleOf(0).checked).toBe(false); // 두 번 토글되어 제자리
  });

  test('X5/X10 — 편집 중 다른 제목을 더블클릭하면 대상이 옮겨가고 이전 초안은 버려진다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await startEdit(0);
    await user.keyboard('버릴 초안');
    await startEdit(1);

    expect(edits()).toHaveLength(1); // X5
    expect(edit().value).toBe('B');
    expect(titles()).toEqual(['A']); // 편집 중인 B만 title이 없고, A는 원래 제목 그대로
  });
});

describe('편집 — 확정(Enter)', () => {
  test('E3/X13/X16 — Enter로 확정하면 제목이 바뀌고 항목이 늘지 않는다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('바뀐 제목{Enter}');

    expect(edits()).toHaveLength(0);
    expect(items()).toHaveLength(1); // X16: Enter가 새 항목을 만들지 않는다
    expect(titleOf(0).textContent).toBe('바뀐 제목');
  });

  test('X12 — 확정되는 제목은 앞뒤 공백이 제거된다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('  공백 낀 제목  {Enter}');
    expect(titleOf(0).textContent).toBe('공백 낀 제목');
  });

  test('X14/X15 — 확정은 완료 상태·순서·개수·카운트를 바꾸지 않는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    await user.click(toggleOf(1)); // B 완료
    expect(countText()).toContain('2');

    await startEdit(1);
    await user.clear(edit());
    await user.keyboard('B2{Enter}');

    expect(titles()).toEqual(['A', 'B2', 'C']); // 위치 보존
    expect(toggleOf(1).checked).toBe(true); // 완료 상태 보존
    expect(countText()).toContain('2'); // X15
  });

  test('X17 — 빈 값으로 확정하면 제목이 그대로고 항목도 지워지지 않는다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('   {Enter}');

    expect(edits()).toHaveLength(0);
    expect(items()).toHaveLength(1);
    expect(titleOf(0).textContent).toBe('A');
  });

  test('X18 — 값을 바꾸지 않고 Enter를 눌러도 정상 확정된다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.keyboard('{Enter}');
    expect(edits()).toHaveLength(0);
    expect(titleOf(0).textContent).toBe('A');
  });

  test('X13 — 편집한 항목만 바뀐다(같은 제목이 둘이어도)', async () => {
    render(<App />);
    await add('같은 제목');
    await add('같은 제목');
    await startEdit(1);
    await user.clear(edit());
    await user.keyboard('둘째만 변경{Enter}');
    expect(titles()).toEqual(['같은 제목', '둘째만 변경']);
  });
});

describe('편집 — 취소(Escape)', () => {
  test('E4/X20 — Escape를 누르면 제목이 편집 전 값으로 남는다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('버릴 값{Escape}');

    expect(edits()).toHaveLength(0);
    expect(items()).toHaveLength(1);
    expect(titleOf(0).textContent).toBe('A');
  });

  test('X21 — 취소한 초안은 다시 편집할 때 남아 있지 않다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.keyboard('버릴 값{Escape}');
    await startEdit(0);
    expect(edit().value).toBe('A');
  });

  test('X22 — 편집 중이 아닐 때의 Escape는 아무 일도 하지 않는다', async () => {
    render(<App />);
    await add('A');
    await user.type(input(), '확정 안 한 값{Escape}');
    expect(input().value).toBe('확정 안 한 값');
    expect(titles()).toEqual(['A']);
    expect(items()).toHaveLength(1);
  });

  test('X24 — 포커스를 잃으면 확정이 아니라 취소다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('확정되면 안 되는 값');
    await user.click(input()); // 편집창 밖으로 포커스 이동

    expect(edits()).toHaveLength(0);
    expect(titleOf(0).textContent).toBe('A');
  });
});

describe('편집 — 다른 요구사항과의 관계', () => {
  test('X25/X26 — 필터를 옮기면 편집이 끝나고, 되돌아와도 되살아나지 않는다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.click(screen.getByTestId('filter-completed'));
    expect(edits()).toHaveLength(0);
    expect(items()).toHaveLength(0);

    await user.click(screen.getByTestId('filter-all'));
    expect(edits()).toHaveLength(0);
    expect(titles()).toEqual(['A']);
  });

  test('X25 — 편집 중인 항목을 삭제해도 편집창이 남지 않는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await startEdit(0);
    await user.click(deleteOf(0));
    expect(edits()).toHaveLength(0);
    expect(titles()).toEqual(['B']);
  });

  test('X26 — 편집 확정이 필터 선택을 바꾸지 않는다', async () => {
    render(<App />);
    await add('A');
    await user.click(screen.getByTestId('filter-active'));
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('A2{Enter}');

    expect(screen.getByTestId('filter-active').getAttribute('aria-pressed')).toBe('true');
    expect(titles()).toEqual(['A2']);
  });

  test('X27/X28 — 바뀐 제목은 복원되지만 편집 상태는 복원되지 않는다', async () => {
    render(<App />);
    await add('A');
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('저장될 제목{Enter}');

    cleanup();
    render(<App />);
    expect(titles()).toEqual(['저장될 제목']);
    expect(edits()).toHaveLength(0); // X28
  });

  test('X33 — 추가·토글·삭제·필터·편집을 섞어도 카운트와 목록이 어긋나지 않는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await startEdit(0);
    await user.clear(edit());
    await user.keyboard('A2{Enter}');
    await user.click(toggleOf(1)); // B 완료
    await add('C');
    await startEdit(2); // C 편집 시작
    await user.keyboard('{Escape}'); // 취소
    await user.click(screen.getByTestId('filter-active'));
    await user.click(deleteOf(0)); // A2 삭제
    await user.click(screen.getByTestId('filter-all'));

    expect(titles()).toEqual(['B', 'C']);
    expect(edits()).toHaveLength(0);
    const activeInDom = items().filter((_, i) => !toggleOf(i).checked).length;
    expect(countText()).toContain(String(activeInDom));
    expect(activeInDom).toBe(1); // C만 미완료
  });
});
