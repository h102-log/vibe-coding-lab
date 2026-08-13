/**
 * SPEC.md의 문장을 옮긴 자체 검증 파일. 각 테스트 제목 앞의 기호(M·U·P + 번호)가 SPEC.md의 문장 번호다.
 * 실행: npx vitest run --config tests/spec/spec.vitest.config.ts
 *
 * tests/ac/** 는 이 파일에서 읽지 않는다. 존재·미변경 여부만 파일 목록과 mtime으로 확인한다.
 *
 * ── 테스트로 옮기지 못한 문장과 그 이유 ──
 * M16 `npm run test:ac` 종료 코드 0 — 이 파일 자체가 vitest 안에서 도는데 그 안에서 다시 인수 테스트를
 *     실행하면 재귀·중복 실행이 된다. 커맨드를 직접 돌려 확인한다(SPEC.md §3에 결과를 적었다).
 * M17 `npm run build` 종료 코드 0 — 같은 이유(테스트 러너 안에서 tsc+vite 빌드를 돌리는 비용이 크다).
 *     커맨드를 직접 돌려 확인한다.
 * M3  tests/ac/** 내용 미변경 — 내용을 비교하려면 파일을 열어야 하는데 계약이 금지한다. 그래서 내용 대신
 *     (a) 두 파일이 그 자리에 그대로 있고 (b) mtime이 내가 만든 파일보다 오래됐다는 것으로 대신 확인한다.
 * M6  src/App.css·src/index.css 내용 미변경 — 저장소 전체가 아직 untracked라 `git diff`로는 확인할 수
 *     없다. M3와 같은 mtime 방식으로 대신 확인한다.
 * U16 리스트 `key`가 id라는 것 — key는 DOM에 드러나지 않는다. 제목이 같은 두 항목이 서로 독립적으로
 *     토글·삭제된다는 관측 가능한 귀결(U10 테스트)로 대신 확인한다.
 * U36 StrictMode에서 렌더 중 부수효과가 없다는 것 — "부수효과 없음" 자체는 관측할 수 없다. StrictMode로
 *     감싸 렌더했을 때 추가가 두 번 일어나지 않고 저장값도 어긋나지 않는다는 귀결로 확인한다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { STORAGE_KEY, loadTodos } from '../../src/todos';

const ROOT = process.cwd();

const CONTRACT_TESTIDS = [
  'todo-input',
  'todo-item',
  'todo-title',
  'todo-toggle',
  'todo-delete',
  'todo-count',
  'filter-all',
  'filter-active',
  'filter-completed',
];

const input = () => screen.getByTestId('todo-input') as HTMLInputElement;
const items = () => screen.queryAllByTestId('todo-item');
const titles = () => items().map((item) => within(item).getByTestId('todo-title').textContent);
const toggleOf = (i: number) =>
  within(items()[i]).getByTestId('todo-toggle') as HTMLInputElement;
const deleteOf = (i: number) => within(items()[i]).getByTestId('todo-delete');
const checks = () => items().map((_, i) => toggleOf(i).checked);
const countText = () => screen.getByTestId('todo-count').textContent;
const filterBtn = (name: 'all' | 'active' | 'completed') =>
  screen.getByTestId(`filter-${name}`) as HTMLButtonElement;

const user = userEvent.setup();
const add = (text: string) => user.type(input(), `${text}{Enter}`);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('DOM 계약 (M7~M14)', () => {
  it('M1 — src/App.tsx의 default export가 컴포넌트고 그것을 렌더한다', () => {
    expect(typeof App).toBe('function');
    render(<App />);
    expect(screen.getByTestId('todo-input')).toBeTruthy();
  });

  it('M7·M13·M14·U35 — 항목이 0개여도 입력창·카운트·필터 3종이 각각 1개씩 있다', () => {
    render(<App />);
    expect(screen.queryAllByTestId('todo-input')).toHaveLength(1);
    expect(screen.queryAllByTestId('todo-count')).toHaveLength(1);
    expect(screen.queryAllByTestId('filter-all')).toHaveLength(1);
    expect(screen.queryAllByTestId('filter-active')).toHaveLength(1);
    expect(screen.queryAllByTestId('filter-completed')).toHaveLength(1);
    expect(input().tagName).toBe('INPUT');
  });

  it('M8·M9·M10·M11·M12 — 항목 n개마다 todo-item이 n개, 그 안에 title/toggle/delete가 1개씩', async () => {
    render(<App />);
    expect(items()).toHaveLength(0);
    await add('우유');
    await add('빵');
    expect(items()).toHaveLength(2);
    for (const item of items()) {
      expect(within(item).queryAllByTestId('todo-title')).toHaveLength(1);
      expect(within(item).queryAllByTestId('todo-toggle')).toHaveLength(1);
      expect(within(item).queryAllByTestId('todo-delete')).toHaveLength(1);
    }
    expect(titles()).toEqual(['우유', '빵']);
    expect(toggleOf(0).tagName).toBe('INPUT');
    expect(toggleOf(0).type).toBe('checkbox');
    expect(deleteOf(0).tagName).toBe('BUTTON');
  });

  it('M15 — 화면에 계약에 없는 testid가 없다 (전체완료 토글·일괄삭제 등 범위 밖 UI 부재)', async () => {
    render(<App />);
    await add('우유');
    await add('빵');
    await user.click(toggleOf(0));
    const found = Array.from(document.querySelectorAll('[data-testid]')).map((el) =>
      el.getAttribute('data-testid'),
    );
    for (const id of found) {
      expect(CONTRACT_TESTIDS).toContain(id);
    }
  });
});

describe('항목 추가 (U1~U11)', () => {
  it('U1·U3 — 입력창에서 Enter를 누르면 항목이 1개 추가된다', async () => {
    render(<App />);
    await add('우유');
    expect(titles()).toEqual(['우유']);
  });

  it('U2 — Enter 없이 타이핑하거나 포커스를 잃는 것으로는 추가되지 않는다', async () => {
    render(<App />);
    await user.type(input(), '우유');
    expect(items()).toHaveLength(0);
    fireEvent.blur(input());
    expect(items()).toHaveLength(0);
    await user.click(filterBtn('all'));
    expect(items()).toHaveLength(0);
  });

  it('U4 — 저장되는 제목은 앞뒤 공백을 제거한 값이다', async () => {
    render(<App />);
    await add('   우유   ');
    expect(titles()).toEqual(['우유']);
  });

  it('U5 — 빈 값이나 공백뿐인 값은 추가되지 않는다', async () => {
    render(<App />);
    await user.type(input(), '{Enter}');
    expect(items()).toHaveLength(0);
    await add('    ');
    expect(items()).toHaveLength(0);
    expect(countText()).toBe('0');
  });

  it('U6 — 추가에 성공하면 입력창이 빈다', async () => {
    render(<App />);
    await add('우유');
    expect(input().value).toBe('');
  });

  it('U7 — 추가되지 않았으면 입력값은 그대로 남는다', async () => {
    render(<App />);
    await add('   ');
    expect(input().value).toBe('   ');
  });

  it('U8 — 새 항목은 목록 맨 뒤에 붙는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    expect(titles()).toEqual(['A', 'B', 'C']);
  });

  it('U9 — 새 항목은 미완료 상태다', async () => {
    render(<App />);
    await add('A');
    expect(toggleOf(0).checked).toBe(false);
    expect(countText()).toBe('1');
  });

  it('U10·U16 — 제목이 같아도 별개 항목이고 서로 독립적으로 토글·삭제된다', async () => {
    render(<App />);
    await add('A');
    await add('A');
    expect(items()).toHaveLength(2);
    await user.click(toggleOf(0));
    expect(checks()).toEqual([true, false]);
    await user.click(deleteOf(0));
    expect(titles()).toEqual(['A']);
    expect(checks()).toEqual([false]);
  });

  it('U11 — IME 조합 중의 Enter로는 추가되지 않는다', async () => {
    render(<App />);
    await user.type(input(), '사과');
    fireEvent.keyDown(input(), { key: 'Enter', isComposing: true });
    expect(items()).toHaveLength(0);
    expect(input().value).toBe('사과');
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(titles()).toEqual(['사과']);
  });
});

describe('토글·삭제 (U12~U15)', () => {
  it('U12·U13 — 토글은 그 항목만 반전시키고 checked가 상태와 일치한다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggleOf(0));
    expect(checks()).toEqual([true, false]);
    await user.click(toggleOf(0));
    expect(checks()).toEqual([false, false]);
  });

  it('U14 — 삭제는 그 항목만 없애고 나머지 순서·완료 상태를 보존한다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    await user.click(toggleOf(2));
    await user.click(deleteOf(1));
    expect(titles()).toEqual(['A', 'C']);
    expect(checks()).toEqual([false, true]);
  });

  it('U15 — 필터가 걸려 일부만 보일 때도 의도한 항목에만 적용된다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    await user.click(toggleOf(1)); // B 완료
    await user.click(filterBtn('active'));
    expect(titles()).toEqual(['A', 'C']);
    await user.click(deleteOf(1)); // 보이는 목록의 두 번째 = C
    await user.click(filterBtn('all'));
    expect(titles()).toEqual(['A', 'B']);
    expect(checks()).toEqual([false, true]);
  });
});

describe('필터 (U17~U25)', () => {
  it('U17 — 최초 렌더는 항목 0개, 필터는 전체', () => {
    render(<App />);
    expect(items()).toHaveLength(0);
    expect(filterBtn('all').getAttribute('aria-pressed')).toBe('true');
    expect(filterBtn('active').getAttribute('aria-pressed')).toBe('false');
    expect(filterBtn('completed').getAttribute('aria-pressed')).toBe('false');
  });

  it('U18·U19·U20·U21 — 각 필터가 해당 항목만 렌더하고, 제외된 항목은 DOM에 없다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggleOf(1)); // B 완료

    await user.click(filterBtn('all'));
    expect(titles()).toEqual(['A', 'B']);

    await user.click(filterBtn('active'));
    expect(titles()).toEqual(['A']);
    expect(screen.queryByText('B')).toBeNull();

    await user.click(filterBtn('completed'));
    expect(titles()).toEqual(['B']);
    expect(screen.queryByText('A')).toBeNull();
  });

  it('U22 — 필터 전환은 항목 데이터를 바꾸지 않는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggleOf(1));
    await user.click(filterBtn('active'));
    await user.click(filterBtn('completed'));
    await user.click(filterBtn('all'));
    expect(titles()).toEqual(['A', 'B']);
    expect(checks()).toEqual([false, true]);
  });

  it('U23 — 필터 조건에서 벗어난 항목은 즉시 목록에서 빠진다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(filterBtn('active'));
    expect(items()).toHaveLength(2);
    await user.click(toggleOf(0));
    expect(titles()).toEqual(['B']);
    await user.click(filterBtn('completed'));
    expect(titles()).toEqual(['A']);
  });

  it('U24 — 필터 버튼은 항상 클릭 가능하고 선택 상태는 aria-pressed로 드러난다', async () => {
    render(<App />);
    for (const name of ['all', 'active', 'completed'] as const) {
      expect(filterBtn(name).disabled).toBe(false);
    }
    await user.click(filterBtn('active'));
    expect(filterBtn('active').getAttribute('aria-pressed')).toBe('true');
    expect(filterBtn('all').getAttribute('aria-pressed')).toBe('false');
    await user.click(filterBtn('active')); // 이미 선택된 필터 재클릭
    expect(filterBtn('active').getAttribute('aria-pressed')).toBe('true');
    await user.click(filterBtn('all'));
    expect(filterBtn('all').getAttribute('aria-pressed')).toBe('true');
  });

  it('U25 — 완료 필터 상태에서 추가해도 항목은 들어가고 필터는 바뀌지 않는다', async () => {
    render(<App />);
    await user.click(filterBtn('completed'));
    await add('A');
    expect(items()).toHaveLength(0);
    expect(countText()).toBe('1');
    expect(filterBtn('completed').getAttribute('aria-pressed')).toBe('true');
    await user.click(filterBtn('all'));
    expect(titles()).toEqual(['A']);
  });
});

describe('todo-count (U26~U29)', () => {
  it('U26 — 필터와 무관하게 전체 항목의 미완료 개수를 센다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');
    await user.click(toggleOf(0));
    expect(countText()).toBe('2');
    await user.click(filterBtn('completed'));
    expect(countText()).toBe('2');
    await user.click(filterBtn('active'));
    expect(countText()).toBe('2');
  });

  it('U27 — 항목이 0개면 0을 표시한다', () => {
    render(<App />);
    expect(countText()).toBe('0');
  });

  it('U28 — 추가·토글·삭제에 따라 즉시 갱신된다', async () => {
    render(<App />);
    expect(countText()).toBe('0');
    await add('A');
    expect(countText()).toBe('1');
    await add('B');
    expect(countText()).toBe('2');
    await user.click(toggleOf(0));
    expect(countText()).toBe('1');
    await user.click(deleteOf(1));
    expect(countText()).toBe('0');
    await user.click(deleteOf(0));
    expect(countText()).toBe('0');
    expect(items()).toHaveLength(0);
  });

  it('U29 — 표시 문자열은 십진수 하나뿐이다', async () => {
    render(<App />);
    expect(countText()).toMatch(/^\d+$/);
    await add('A');
    expect(countText()).toMatch(/^\d+$/);
    expect(countText()).toBe('1');
  });
});

describe('나머지 화면 규칙 (U33~U36)', () => {
  it('U33 — 제목을 클릭해도 아무 일도 일어나지 않는다', async () => {
    render(<App />);
    await add('A');
    await user.click(within(items()[0]).getByTestId('todo-title'));
    expect(toggleOf(0).checked).toBe(false);
    expect(titles()).toEqual(['A']);
  });

  it('U34 — 삭제·필터 버튼은 type="button"이다', async () => {
    render(<App />);
    await add('A');
    expect(deleteOf(0).getAttribute('type')).toBe('button');
    for (const name of ['all', 'active', 'completed'] as const) {
      expect(filterBtn(name).getAttribute('type')).toBe('button');
    }
  });

  it('U36 — StrictMode 이중 렌더에서도 추가가 한 번만 일어난다', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await add('A');
    expect(titles()).toEqual(['A']);
    expect(loadTodos()).toHaveLength(1);
  });
});

describe('영속성 (P1~P6)', () => {
  it('P1 — 언마운트 후 다시 마운트하면 제목·순서·완료 상태가 복원된다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggleOf(0));
    cleanup();

    render(<App />);
    expect(titles()).toEqual(['A', 'B']);
    expect(checks()).toEqual([true, false]);
    expect(countText()).toBe('1');
  });

  it('P2 — 복원 후 새로 추가한 항목의 id는 복원된 항목과 겹치지 않는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    cleanup();

    render(<App />);
    await add('C');
    expect(titles()).toEqual(['A', 'B', 'C']);
    await user.click(toggleOf(2));
    expect(checks()).toEqual([false, false, true]);
    await user.click(deleteOf(0));
    expect(titles()).toEqual(['B', 'C']);
    expect(checks()).toEqual([false, true]);
  });

  it('P3 — 저장값이 깨져 있으면 던지지 않고 성한 것만 살린다', () => {
    const broken = ['', 'not json', '{"a":1}', '[1,2,3]', '[{"id":"x","title":1}]', 'null'];
    for (const raw of broken) {
      localStorage.setItem(STORAGE_KEY, raw);
      expect(() => render(<App />)).not.toThrow();
      expect(items()).toHaveLength(0);
      expect(countText()).toBe('0');
      cleanup();
    }
    localStorage.setItem(
      STORAGE_KEY,
      '[{"id":1,"title":"A","done":false},{"nope":true},{"id":2,"title":"B","done":true}]',
    );
    render(<App />);
    expect(titles()).toEqual(['A', 'B']);
    expect(checks()).toEqual([false, true]);
  });

  it('P4 — 필터는 저장되지 않는다 (다시 마운트하면 전체)', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggleOf(0));
    await user.click(filterBtn('completed'));
    expect(titles()).toEqual(['A']);
    cleanup();

    render(<App />);
    expect(filterBtn('all').getAttribute('aria-pressed')).toBe('true');
    expect(titles()).toEqual(['A', 'B']);
  });

  it('P5 — 목록이 바뀌면 저장값이 즉시 갱신된다', async () => {
    render(<App />);
    await add('A');
    expect(loadTodos().map((t) => t.title)).toEqual(['A']);
    await add('B');
    await user.click(toggleOf(1));
    expect(loadTodos().map((t) => [t.title, t.done])).toEqual([
      ['A', false],
      ['B', true],
    ]);
    await user.click(deleteOf(0));
    expect(loadTodos().map((t) => t.title)).toEqual(['B']);
  });

  it('P5 — 저장소가 예외를 던져도 화면은 그대로 동작한다', async () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota exceeded');
    };
    try {
      render(<App />);
      await add('A');
      expect(titles()).toEqual(['A']);
      await user.click(toggleOf(0));
      expect(checks()).toEqual([true]);
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it('P6 — 저장소에 쓰는 키는 항목 목록 하나뿐이다', async () => {
    render(<App />);
    await add('A');
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY]);
  });
});

describe('저장소 밖의 규칙 — 소스·파일 상태 (M2~M6, M15, U31, U32, U37)', () => {
  const sourceFiles = () =>
    readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' })
      .filter((name) => /\.(ts|tsx)$/.test(name))
      .map((name) => join(ROOT, 'src', name));

  it('M2 — 런타임 의존성은 react·react-dom뿐이다 (다른 프레임워크 없음)', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['react', 'react-dom']);
  });

  it('M4 — build·test:ac 스크립트가 그대로다', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toBe('tsc -b && vite build');
    expect(pkg.scripts['test:ac']).toBe('vitest run --config tests/ac/ac.vitest.config.ts');
  });

  it('M5 — tsconfig.app.json의 strict가 true다', () => {
    const text = readFileSync(join(ROOT, 'tsconfig.app.json'), 'utf8');
    expect(text).toMatch(/"strict"\s*:\s*true/);
  });

  it('M6 — src의 스타일 파일은 App.css·index.css 둘뿐이다 (새 스타일 파일 없음)', () => {
    const styles = readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' })
      .filter((name) => /\.(css|scss|sass|less|styl)$/.test(name))
      .map((name) => name.replace(/\\/g, '/'))
      .sort();
    expect(styles).toEqual(['App.css', 'index.css']);
    const rootStyles = readdirSync(ROOT, { encoding: 'utf8' }).filter((name) =>
      /\.(css|scss|sass|less|styl)$/.test(name),
    );
    expect(rootStyles).toEqual([]);
  });

  it('M3·M6·U37 — 고정 파일이 제자리에 있고 내가 만든 파일보다 오래됐다 (미변경)', () => {
    const frozen = [
      'index.html',
      'package.json',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'vite.config.ts',
      'src/main.tsx',
      'src/App.css',
      'src/index.css',
      'tests/ac/ac.vitest.config.ts',
      'tests/ac/todo.ac.test.tsx',
    ];
    const mine = statSync(join(ROOT, 'src/App.tsx')).mtimeMs;
    for (const rel of frozen) {
      const stat = statSync(join(ROOT, rel));
      expect(stat.isFile()).toBe(true);
      expect(stat.mtimeMs).toBeLessThan(mine);
    }
    expect(readdirSync(join(ROOT, 'tests/ac')).sort()).toEqual([
      'ac.vitest.config.ts',
      'todo.ac.test.tsx',
    ]);
  });

  it('M15·U31·U32·P6 — 범위 밖 기능의 흔적이 소스에 없다', () => {
    const forbidden: [RegExp, string][] = [
      [/\bfetch\s*\(/, '네트워크 요청'],
      [/XMLHttpRequest/, '네트워크 요청'],
      [/WebSocket/, '네트워크 요청'],
      [/EventSource/, '네트워크 요청'],
      [/onDoubleClick|dblclick/i, '인라인 제목 편집'],
      [/draggable|onDrag[A-Z]/, '드래그 정렬'],
      [/toggle-all|clear-completed/, '전체 완료 토글·완료 일괄 삭제'],
      [/dueDate|priority/i, '마감일·우선순위'],
      [/prefers-color-scheme|darkMode|toggleTheme/i, '다크모드·테마 전환'],
      [/i18n|useTranslation|changeLanguage/i, '다국어'],
      [/@keyframes|requestAnimationFrame/, '애니메이션'],
      [/<meta|document\.title/, 'SEO 메타태그'],
    ];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, 'utf8');
      for (const [pattern, what] of forbidden) {
        expect(pattern.test(text), `${file}에 ${what}의 흔적(${pattern})`).toBe(false);
      }
    }
  });

  it('U37 — 구현 파일은 src/App.tsx와 그 아래 새로 만든 것뿐이다', () => {
    const created = sourceFiles()
      .map((path) => path.slice(join(ROOT, 'src').length + 1).replace(/\\/g, '/'))
      .sort();
    expect(created).toEqual(['App.tsx', 'main.tsx', 'todos.ts']);
  });
});
