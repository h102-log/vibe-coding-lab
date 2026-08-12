/**
 * @vitest-environment jsdom
 *
 * SPEC.md의 §1(명시된 것)·§2(명시되지 않은 것) 문장을 옮긴 검증 테스트다.
 * 각 테스트 이름 앞의 S·U 번호가 SPEC.md의 문장 번호다.
 *
 * `tests/ac/**`와는 무관하며 그쪽 파일을 열지도 부르지도 않는다.
 * 실행: npm run test:spec
 *
 * ── 테스트로 옮기지 못한 문장과 그 이유 ──────────────────────────────
 * S8  (`tests/ac/**` 미수정): "파일을 건드리지 않았다"는 절차에 대한 약속이라
 *     앱 동작으로 확인할 수 없다. 원본 사본이 없고, 내용을 읽는 것 자체가 금지라
 *     내용 비교도 불가능하다. 여기서는 두 파일이 지워지거나 옮겨지지 않았다는
 *     것(경로 존재)까지만 확인한다. 나머지는 SPEC.md §3의 대조로 남긴다.
 * S10 (CSS 파일 미수정): 위와 같은 이유로 '수정하지 않았음'은 기준점이 없어
 *     확인할 수 없다. 확인 가능한 부분 — 새 스타일 파일이 생기지 않았다는 것 —
 *     만 테스트로 옮긴다.
 * S12·S13 (`npm run test:ac`·`npm run build` 성공): 테스트 안에서 자기 자신을
 *     포함한 테스트 러너와 빌드를 다시 돌리는 것이라 옮기지 않는다. 두 커맨드를
 *     직접 실행해 확인했고 결과는 SPEC.md §3에 적었다.
 * S11 중 '배포'와 'SEO 메타태그': 배포는 저장소 안에서 관측할 대상이 아니고,
 *     메타태그는 `index.html`의 문제인데 그 파일을 손대지 않았다. 나머지 범위 밖
 *     항목은 아래 S11 테스트에서 화면으로 확인한다.
 * ────────────────────────────────────────────────────────────────────
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import App from '../../src/App';
import { STORAGE_KEY } from '../../src/todos/storage';
import { activeCount, addTodo, nextIdFor, removeTodo, toggleTodo, visibleTodos } from '../../src/todos/model';
import type { Todo } from '../../src/todos/model';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const input = () => screen.getByTestId('todo-input') as HTMLInputElement;
const items = () => screen.queryAllByTestId('todo-item');
const titles = () => items().map((item) => within(item).getByTestId('todo-title').textContent);
const toggleOf = (index: number) =>
  within(items()[index]).getByTestId('todo-toggle') as HTMLInputElement;
const deleteOf = (index: number) => within(items()[index]).getByTestId('todo-delete');
const count = () => screen.getByTestId('todo-count').textContent;
const checks = () => items().map((_, index) => toggleOf(index).checked);

const add = async (user: UserEvent, text: string) => {
  await user.type(input(), `${text}{Enter}`);
};

/** 한글·특수문자·아주 긴 문자열은 키보드 매핑을 타지 않게 값만 넣고 Enter를 보낸다. */
const addRaw = (text: string) => {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.keyDown(input(), { key: 'Enter' });
};

const seedStorage = (todos: Todo[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('§1 명시된 것', () => {
  it('S1 진입 컴포넌트는 src/App.tsx의 default export이고 렌더된다', () => {
    expect(typeof App).toBe('function');
    render(<App />);
    expect(document.body.textContent).not.toBe('');
  });

  it('S2 todo-input이 화면에 하나 있다', () => {
    render(<App />);
    expect(screen.getAllByTestId('todo-input')).toHaveLength(1);
  });

  it('S3 항목은 0개일 수 있고, 추가한 개수만큼 todo-item이 렌더된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(items()).toHaveLength(0);
    await add(user, 'A');
    await add(user, 'B');
    expect(items()).toHaveLength(2);
  });

  it('S4 각 todo-item 안에 todo-title·todo-toggle·todo-delete가 하나씩 있다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    for (const item of items()) {
      expect(within(item).getAllByTestId('todo-title')).toHaveLength(1);
      expect(within(item).getAllByTestId('todo-toggle')).toHaveLength(1);
      expect(within(item).getAllByTestId('todo-delete')).toHaveLength(1);
    }
  });

  it('S5 todo-count가 미완료 개수를 표시한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    expect(count()).toBe('2');
    await user.click(toggleOf(0));
    expect(count()).toBe('1');
  });

  it('S6 세 필터 버튼이 화면에 있다', () => {
    render(<App />);
    expect(screen.getAllByTestId('filter-all')).toHaveLength(1);
    expect(screen.getAllByTestId('filter-active')).toHaveLength(1);
    expect(screen.getAllByTestId('filter-completed')).toHaveLength(1);
  });

  it('S7 런타임 의존성은 react·react-dom뿐이다 (다른 프레임워크 없음)', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['react', 'react-dom']);
  });

  it('S8 tests/ac의 파일이 지워지거나 옮겨지지 않았다 (내용은 열지 않는다)', () => {
    expect(existsSync(join(ROOT, 'tests', 'ac', 'ac.vitest.config.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'tests', 'ac', 'todo.ac.test.tsx'))).toBe(true);
  });

  it('S9 build·test:ac 스크립트와 strict 설정이 그대로다', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toBe('tsc -b && vite build');
    expect(pkg.scripts['test:ac']).toBe('vitest run --config tests/ac/ac.vitest.config.ts');
    // tsconfig.app.json은 주석이 있는 JSONC라 파싱 대신 문자열로 확인한다.
    const tsconfig = readFileSync(join(ROOT, 'tsconfig.app.json'), 'utf8');
    expect(/"strict"\s*:\s*true/.test(tsconfig)).toBe(true);
  });

  it('S10 src 아래 스타일 파일은 App.css·index.css 둘뿐이다 (새 스타일 파일 없음)', () => {
    const styleExtensions = ['.css', '.scss', '.sass', '.less', '.styl'];
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (styleExtensions.some((ext) => entry.endsWith(ext))) found.push(entry);
      }
    };
    walk(join(ROOT, 'src'));
    expect(found.sort()).toEqual(['App.css', 'index.css']);
  });

  it('S11 범위 밖 기능이 화면에 없다 — 인라인 편집·전체완료·일괄삭제·드래그·서버호출', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');

    // 더블클릭해도 편집용 입력이 생기지 않는다 (인라인 제목 편집 없음).
    await user.dblClick(within(items()[0]).getByTestId('todo-title'));
    expect(screen.getAllByRole('textbox')).toHaveLength(1);

    // 체크박스는 항목당 하나뿐이다 (전체 완료 토글 없음).
    expect(screen.getAllByTestId('todo-toggle')).toHaveLength(2);
    expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);

    // 버튼은 필터 3개 + 항목별 삭제뿐이다
    // (완료 일괄 삭제·테마 전환·로케일 전환·정렬 버튼 없음).
    expect(document.querySelectorAll('button')).toHaveLength(3 + 2);

    // 드래그 정렬 없음.
    expect(document.querySelectorAll('[draggable]')).toHaveLength(0);

    // 서버 API 호출 없음 (로그인·DB 연동 없음).
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('§2 추가', () => {
  it('U1 문자를 입력하고 Enter를 누르면 항목이 정확히 1개 늘어난다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    expect(items()).toHaveLength(1);
    expect(titles()).toEqual(['A']);
  });

  it('U2 제목은 앞뒤 공백을 제거한 값이다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, '   hello   ');
    expect(titles()).toEqual(['hello']);
  });

  it('U3 비었거나 공백뿐이면 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(input(), '{Enter}');
    expect(items()).toHaveLength(0);
    await add(user, '     ');
    expect(items()).toHaveLength(0);
  });

  it('U4 Enter 뒤 입력창은 비워진다 (추가 성공 여부와 무관)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    expect(input().value).toBe('');
    await add(user, '    ');
    expect(input().value).toBe('');
  });

  it('U5 새 항목은 맨 뒤에 붙는다 (입력 순서 = 표시 순서)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await add(user, 'C');
    expect(titles()).toEqual(['A', 'B', 'C']);
  });

  it('U6 새 항목은 미완료로 시작한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    expect(toggleOf(0).checked).toBe(false);
    expect(count()).toBe('1');
  });

  it('U7 같은 제목을 두 번 추가하면 항목 2개가 된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'same');
    await add(user, 'same');
    expect(items()).toHaveLength(2);
    expect(titles()).toEqual(['same', 'same']);
  });

  it('U8 Enter 없이 입력만 하면 항목이 늘지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(input(), 'abc');
    expect(items()).toHaveLength(0);
    expect(input().value).toBe('abc');
  });

  it('U9 submit이 일어나도 한 번의 Enter로 1개만 추가된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    expect(items()).toHaveLength(1);

    // 브라우저는 입력창 하나짜리 폼에서 Enter를 암묵적 제출로 바꾼다. 그 경로로
    // 두 번 추가되지 않는 근거는 keydown에서 기본 동작을 막는 것이다 — 그것을 직접 본다.
    await user.type(input(), 'B');
    const enter = createEvent.keyDown(input(), { key: 'Enter' });
    fireEvent(input(), enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(titles()).toEqual(['A', 'B']);

    // 제출 이벤트가 직접 오는 경로도 같은 동작을 한다 (한 번만 추가).
    await user.type(input(), 'C');
    const form = input().closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(titles()).toEqual(['A', 'B', 'C']);
  });

  it('U37 IME 조합 중의 Enter로는 추가되지 않는다', () => {
    render(<App />);
    fireEvent.change(input(), { target: { value: '가' } });
    fireEvent.keyDown(input(), { key: 'Enter', isComposing: true });
    expect(items()).toHaveLength(0);
    expect(input().value).toBe('가');
    // 조합이 끝난 뒤의 Enter는 추가한다.
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(titles()).toEqual(['가']);
  });

  it('U38 StrictMode 이중 렌더에서도 중복 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await add(user, 'A');
    expect(items()).toHaveLength(1);
    expect(titles()).toEqual(['A']);
  });
});

describe('§2 토글', () => {
  it('U10 todo-toggle은 체크박스이고 checked가 완료 여부와 같다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    expect(toggleOf(0).tagName).toBe('INPUT');
    expect(toggleOf(0).type).toBe('checkbox');
    expect(toggleOf(0).checked).toBe(false);
    await user.click(toggleOf(0));
    expect(toggleOf(0).checked).toBe(true);
    await user.click(toggleOf(0));
    expect(toggleOf(0).checked).toBe(false);
  });

  it('U11 클릭한 항목만 반전되고 다른 항목은 그대로다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await add(user, 'C');
    await user.click(toggleOf(1));
    expect(checks()).toEqual([false, true, false]);
  });

  it('U12 완료해도 todo-title 텍스트는 제목 그대로다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await user.click(toggleOf(0));
    expect(titles()).toEqual(['A']);
  });

  it('U13 완료해도 목록 내 위치가 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await add(user, 'C');
    await user.click(toggleOf(0));
    expect(titles()).toEqual(['A', 'B', 'C']);
    expect(checks()).toEqual([true, false, false]);
  });
});

describe('§2 삭제', () => {
  it('U14 누른 항목만 사라지고 나머지 순서는 유지된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await add(user, 'C');
    await user.click(deleteOf(1));
    expect(titles()).toEqual(['A', 'C']);
  });

  it('U15 확인 절차 없이 즉시 삭제된다', async () => {
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await user.click(deleteOf(0));
    expect(items()).toHaveLength(0);
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});

describe('§2 개수', () => {
  it('U16 todo-count 텍스트는 숫자뿐이다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    expect(count()).toBe('2');
    expect(count()).toMatch(/^\d+$/);
  });

  it('U17 개수는 현재 필터와 무관하게 전체 기준이다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await user.click(toggleOf(0));
    await user.click(screen.getByTestId('filter-completed'));
    expect(items()).toHaveLength(1);
    expect(count()).toBe('1');
    await user.click(screen.getByTestId('filter-active'));
    expect(count()).toBe('1');
  });

  it('U18 항목이 없으면 0이다', () => {
    render(<App />);
    expect(count()).toBe('0');
  });

  it('U19 추가·토글·삭제 직후 즉시 갱신된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(count()).toBe('0');
    await add(user, 'A');
    expect(count()).toBe('1');
    await add(user, 'B');
    expect(count()).toBe('2');
    await user.click(toggleOf(0));
    expect(count()).toBe('1');
    await user.click(deleteOf(1));
    expect(count()).toBe('0');
  });
});

describe('§2 필터', () => {
  const setupThree = async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await add(user, 'C');
    await user.click(toggleOf(1)); // B 완료
    return user;
  };

  it('U20 초기 필터는 전체다', async () => {
    await setupThree();
    expect(titles()).toEqual(['A', 'B', 'C']);
    // MISSING(선택된 필터의 시각적 표기): 기계가 읽는 aria-pressed만 검사한다.
    expect(screen.getByTestId('filter-all').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('filter-active').getAttribute('aria-pressed')).toBe('false');
  });

  it('U21 filter-active는 미완료만 보여준다', async () => {
    const user = await setupThree();
    await user.click(screen.getByTestId('filter-active'));
    expect(titles()).toEqual(['A', 'C']);
  });

  it('U22 filter-completed는 완료만 보여준다', async () => {
    const user = await setupThree();
    await user.click(screen.getByTestId('filter-completed'));
    expect(titles()).toEqual(['B']);
  });

  it('U23 filter-all은 모든 항목을 원래 순서로 보여준다', async () => {
    const user = await setupThree();
    await user.click(screen.getByTestId('filter-completed'));
    await user.click(screen.getByTestId('filter-all'));
    expect(titles()).toEqual(['A', 'B', 'C']);
  });

  it('U24 필터는 데이터를 지우지 않는다', async () => {
    const user = await setupThree();
    await user.click(screen.getByTestId('filter-active'));
    await user.click(screen.getByTestId('filter-completed'));
    await user.click(screen.getByTestId('filter-all'));
    expect(titles()).toEqual(['A', 'B', 'C']);
    expect(checks()).toEqual([false, true, false]);
  });

  it('U25 필터 조건을 벗어난 항목은 즉시 사라진다', async () => {
    const user = await setupThree();
    await user.click(screen.getByTestId('filter-active'));
    expect(titles()).toEqual(['A', 'C']);
    await user.click(toggleOf(0)); // A 완료 → 미완료 목록에서 빠진다
    expect(titles()).toEqual(['C']);
  });

  it('U26 필터가 걸린 상태에서도 추가는 성공한다', async () => {
    const user = await setupThree();
    await user.click(screen.getByTestId('filter-completed'));
    await add(user, 'D');
    expect(titles()).toEqual(['B']); // D는 미완료라 여기 안 보인다
    await user.click(screen.getByTestId('filter-all'));
    expect(titles()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('U27 필터 버튼은 disabled가 아니고 반복해 눌러도 된다', async () => {
    const user = await setupThree();
    for (const id of ['filter-all', 'filter-active', 'filter-completed']) {
      expect((screen.getByTestId(id) as HTMLButtonElement).disabled).toBe(false);
    }
    await user.click(screen.getByTestId('filter-active'));
    await user.click(screen.getByTestId('filter-active'));
    expect(titles()).toEqual(['A', 'C']);
  });

  it('U28 필터 상태의 삭제는 목록 전체에서 제거한다', async () => {
    const user = await setupThree();
    await user.click(screen.getByTestId('filter-active'));
    await user.click(deleteOf(0)); // A 삭제
    expect(titles()).toEqual(['C']);
    await user.click(screen.getByTestId('filter-all'));
    expect(titles()).toEqual(['B', 'C']);
  });
});

describe('§2 저장', () => {
  it('U29 다시 마운트하면 제목·순서·완료 여부가 복원된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await user.click(toggleOf(0));

    cleanup();
    render(<App />);
    expect(titles()).toEqual(['A', 'B']);
    expect(checks()).toEqual([true, false]);
    expect(count()).toBe('1');
  });

  it('U39 저장값이 없거나 깨졌으면 빈 목록으로 시작하고 예외를 던지지 않는다', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(() => render(<App />)).not.toThrow();
    expect(items()).toHaveLength(0);

    cleanup();
    localStorage.setItem(STORAGE_KEY, '{"nope":1}');
    expect(() => render(<App />)).not.toThrow();
    expect(items()).toHaveLength(0);

    cleanup();
    // 배열이지만 항목 모양이 아닌 값은 걸러지고 멀쩡한 것만 남는다.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'todo-1', title: 'A', done: false }, 42, null, { id: 'x' }]),
    );
    render(<App />);
    expect(titles()).toEqual(['A']);
  });

  it('U40 필터 선택은 저장되지 않는다 (다시 마운트하면 전체)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await user.click(screen.getByTestId('filter-completed'));
    expect(items()).toHaveLength(0);

    cleanup();
    render(<App />);
    expect(titles()).toEqual(['A']);
    expect(screen.getByTestId('filter-all').getAttribute('aria-pressed')).toBe('true');
  });

  it('U41 복원된 항목과 새로 추가한 항목의 id가 겹치지 않는다', async () => {
    seedStorage([
      { id: 'todo-1', title: 'A', done: false },
      { id: 'todo-2', title: 'B', done: false },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'C');
    // id가 겹치면 C를 토글할 때 A나 B가 함께 뒤집힌다.
    await user.click(toggleOf(2));
    expect(checks()).toEqual([false, false, true]);
    // 순수 함수 차원의 같은 성질.
    expect(nextIdFor([{ id: 'todo-1', title: 'A', done: false }])).toBe('todo-2');
    expect(nextIdFor([{ id: 'todo-7', title: 'A', done: false }])).toBe('todo-8');
    expect(nextIdFor([])).toBe('todo-1');
  });

  it('U42 저장이 실패해도 화면 동작은 계속된다', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const user = userEvent.setup();
    expect(() => render(<App />)).not.toThrow();
    await add(user, 'A');
    await add(user, 'B');
    await user.click(toggleOf(0));
    await user.click(deleteOf(1));
    expect(titles()).toEqual(['A']);
    expect(checks()).toEqual([true]);
  });
});

describe('§2 나머지', () => {
  it('U30 HTML처럼 보이는 제목도 텍스트 그대로 표시된다', () => {
    render(<App />);
    addRaw('<b>주의</b>');
    const title = within(items()[0]).getByTestId('todo-title');
    expect(title.textContent).toBe('<b>주의</b>');
    expect(title.querySelector('b')).toBeNull();
  });

  it('U31 제목 길이에 상한이 없다', () => {
    const long = 'ㄱ'.repeat(500);
    render(<App />);
    addRaw(long);
    expect(titles()).toEqual([long]);
  });

  it('U32 toggle·title·delete는 각자 자기 todo-item 안에 있다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    for (const item of items()) {
      expect(item.contains(within(item).getByTestId('todo-title'))).toBe(true);
      expect(item.contains(within(item).getByTestId('todo-toggle'))).toBe(true);
      expect(item.contains(within(item).getByTestId('todo-delete'))).toBe(true);
    }
    // 항목 밖에 떠 있는 것이 없다.
    expect(screen.getAllByTestId('todo-toggle')).toHaveLength(2);
    expect(screen.getAllByTestId('todo-delete')).toHaveLength(2);
  });

  it('U33 전체에서 모아 얻은 순서가 todo-item 순서와 같다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    await add(user, 'B');
    await add(user, 'C');
    await user.click(screen.getAllByTestId('todo-toggle')[2]);
    expect(screen.getAllByTestId('todo-title').map((el) => el.textContent)).toEqual(titles());
    expect(checks()).toEqual([false, false, true]);
    await user.click(screen.getAllByTestId('todo-delete')[0]);
    expect(titles()).toEqual(['B', 'C']);
  });

  it('U34 제목이 같은 항목도 서로 독립적으로 토글·삭제된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'dup');
    await add(user, 'dup');
    await add(user, 'dup');
    await user.click(toggleOf(1));
    expect(checks()).toEqual([false, true, false]);
    await user.click(deleteOf(1));
    expect(titles()).toEqual(['dup', 'dup']);
    expect(checks()).toEqual([false, false]);
  });

  it('U35 삭제·필터 버튼은 type="button"이다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    expect(deleteOf(0).getAttribute('type')).toBe('button');
    for (const id of ['filter-all', 'filter-active', 'filter-completed']) {
      expect(screen.getByTestId(id).getAttribute('type')).toBe('button');
    }
  });

  it('U36 로케일 전환 수단이 없다 (한국어 하나뿐)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await add(user, 'A');
    // 버튼은 필터 3개 + 삭제 1개뿐 — 언어 전환 버튼이 없다.
    expect(document.querySelectorAll('button')).toHaveLength(4);
    expect(document.querySelectorAll('select')).toHaveLength(0);
  });
});

describe('§2 모델 (순수 함수 차원의 같은 문장)', () => {
  const A: Todo = { id: 'todo-1', title: 'A', done: false };
  const B: Todo = { id: 'todo-2', title: 'B', done: true };

  it('U2·U3·U5·U6 addTodo는 공백을 떼고, 빈 값은 무시하고, 뒤에 붙인다', () => {
    expect(addTodo([], '  x  ')).toEqual([{ id: 'todo-1', title: 'x', done: false }]);
    expect(addTodo([A], '   ')).toEqual([A]);
    expect(addTodo([A], '')).toEqual([A]);
    expect(addTodo([A], 'B').map((todo) => todo.title)).toEqual(['A', 'B']);
  });

  it('U11·U13 toggleTodo는 해당 항목만 뒤집고 위치를 유지한다', () => {
    expect(toggleTodo([A, B], 'todo-1')).toEqual([{ ...A, done: true }, B]);
    expect(toggleTodo([A, B], 'nope')).toEqual([A, B]);
  });

  it('U14 removeTodo는 해당 항목만 뺀다', () => {
    expect(removeTodo([A, B], 'todo-1')).toEqual([B]);
    expect(removeTodo([A, B], 'nope')).toEqual([A, B]);
  });

  it('U21·U22·U23·U24 visibleTodos는 고르기만 하고 원본을 바꾸지 않는다', () => {
    const source = [A, B];
    expect(visibleTodos(source, 'all')).toEqual([A, B]);
    expect(visibleTodos(source, 'active')).toEqual([A]);
    expect(visibleTodos(source, 'completed')).toEqual([B]);
    expect(source).toEqual([A, B]);
  });

  it('U17·U18 activeCount는 미완료만 센다', () => {
    expect(activeCount([])).toBe(0);
    expect(activeCount([A, B])).toBe(1);
    expect(activeCount([B])).toBe(0);
  });
});
