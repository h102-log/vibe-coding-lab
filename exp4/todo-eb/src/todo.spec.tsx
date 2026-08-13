/**
 * SPEC.md §4 — 자체 검증.
 *
 * SPEC.md 1·2번의 문장을 하나씩 테스트로 옮긴 것이다. 각 `it` 제목 앞의 S-xx / U-xx 가
 * 그 테스트가 지키는 문장의 번호다. 실행: `npm run test:spec`
 * (인수 테스트 `tests/ac/**` 와는 별개의 파일·설정이며, 그쪽은 열지 않고 실행만 했다.)
 *
 * 테스트로 옮기지 못한 문장과 그 이유:
 * - S-09 `npm run test:ac` 성공 / S-10 `npm run build` 성공
 *   → 테스트 러너 안에서 자기 자신과 빌드를 다시 실행하는 것은 순환이라 옮기지 않았다.
 *     두 커맨드를 직접 실행해 확인했고, 결과는 SPEC.md §3 에 적었다.
 * - S-12 `tests/ac/**` 미변경의 "내용이 그대로다" 부분
 *   → 내용 비교는 그 파일을 여는 일이라 계약이 금지한다. 파일을 열지 않고 관측 가능한
 *     범위(존재·파일명 목록·수정시각)로만 검사한다. 아래 S-12 테스트가 그것이다.
 * - S-15/S-16 의 "만들지 않았다"는 전수로 증명할 수 없다.
 *   → 관측 가능한 대리 지표로 옮겼다: 화면에 존재하는 input/button 의 전수 목록이
 *     계약이 요구한 것과 정확히 일치하는지(= 추가 컨트롤이 없는지), 제목 더블클릭에
 *     편집창이 생기지 않는지, 소스에 네트워크·타이머·대화상자 호출이 없는지.
 * - SPEC.md §2.7 의 `[MISSING: …]` 2건(빈 목록 안내 문구, placeholder 문구)
 *   → 근거가 없어 요구사항으로 확정하지 않은 항목이므로 지킬 테스트도 두지 않는다.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { StrictMode } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const ROOT = process.cwd();

const input = () => screen.getByTestId('todo-input') as HTMLInputElement;
const items = () => screen.queryAllByTestId('todo-item');
const titles = () => screen.queryAllByTestId('todo-title').map((el) => el.textContent);
const toggles = () => screen.queryAllByTestId('todo-toggle') as HTMLInputElement[];
const count = () => screen.getByTestId('todo-count').textContent;
const deletes = () => screen.queryAllByTestId('todo-delete');
const filters = () => ({
  all: screen.getByTestId('filter-all'),
  active: screen.getByTestId('filter-active'),
  completed: screen.getByTestId('filter-completed'),
});

// 테스트마다 새로 만든다. 인스턴스를 공유하면 cleanup 이후에도 이전 document 를 붙들어
// 입력이 다음 테스트로 새어 들어간다. delay: null 은 키 입력 사이의 타이머를 없앤다.
let user: ReturnType<typeof userEvent.setup>;

async function add(text: string) {
  await user.click(input());
  await user.type(input(), `${text}{Enter}`);
}

beforeEach(() => {
  localStorage.clear();
  user = userEvent.setup({ delay: null });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('저장소 불변식 (SPEC §1)', () => {
  it('S-07/S-08: 진입점은 src/App.tsx 의 default export 이고, 구현 파일은 src 아래에만 있다', () => {
    expect(typeof App).toBe('function');

    const srcFiles = readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' });
    // 구현으로 새로 만든 파일은 전부 src/todos/ 아래에 있다.
    expect(srcFiles).toContain('App.tsx');
    const implFiles = srcFiles
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => f.startsWith('todos/'))
      .sort();
    expect(implFiles).toEqual([
      'todos/TodoItem.tsx',
      'todos/storage.ts',
      'todos/types.ts',
      'todos/useTodos.ts',
    ]);
  });

  it('S-11: build·test:ac 스크립트와 strict:true 가 그대로다', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toBe('tsc -b && vite build');
    expect(pkg.scripts['test:ac']).toBe('vitest run --config tests/ac/ac.vitest.config.ts');

    const tsconfigApp = readFileSync(join(ROOT, 'tsconfig.app.json'), 'utf8');
    expect(tsconfigApp).toMatch(/"strict"\s*:\s*true/);
  });

  it('S-12: tests/ac 의 파일이 그대로 있고(삭제·이동 없음) 내 작업 시각 이후로 수정되지 않았다', () => {
    // 파일명 목록과 수정시각만 본다 — 내용은 열지 않는다.
    expect(readdirSync(join(ROOT, 'tests', 'ac')).sort()).toEqual([
      'ac.vitest.config.ts',
      'todo.ac.test.tsx',
    ]);

    const mine = statSync(join(ROOT, 'src', 'App.tsx')).mtimeMs;
    for (const name of ['ac.vitest.config.ts', 'todo.ac.test.tsx']) {
      expect(statSync(join(ROOT, 'tests', 'ac', name)).mtimeMs).toBeLessThanOrEqual(mine);
    }
  });

  it('S-13: 런타임 의존성은 react·react-dom 뿐이고 다른 프레임워크가 없다', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['react', 'react-dom']);

    const all = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)];
    expect(all.filter((n) => /vue|svelte|angular|solid-js|preact|next|nuxt|jquery/.test(n))).toEqual(
      [],
    );
  });

  it('S-14: 스타일 파일은 원래 둘뿐이고 수정되지 않았다', () => {
    const cssFiles = readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' })
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /\.(css|scss|sass|less)$/.test(f))
      .sort();
    expect(cssFiles).toEqual(['App.css', 'index.css']);

    const mine = statSync(join(ROOT, 'src', 'App.tsx')).mtimeMs;
    for (const name of cssFiles) {
      expect(statSync(join(ROOT, 'src', name)).mtimeMs).toBeLessThanOrEqual(mine);
    }
  });

  it('S-12/S-14 보강: git 이 tests/ac 와 css 파일의 변경을 보고하지 않는다', () => {
    // 이 디렉터리가 아직 커밋 전이면 전부 untracked 로 보고되므로, 그때는 검사를 건너뛴다.
    const tracked = execFileSync('git', ['ls-files', '--', 'tests/ac', 'src/App.css'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    if (tracked === '') return;

    const dirty = execFileSync(
      'git',
      ['status', '--porcelain', '--', 'tests/ac', 'src/App.css', 'src/index.css'],
      { cwd: ROOT, encoding: 'utf8' },
    ).trim();
    expect(dirty).toBe('');
  });
});

describe('DOM 계약 (SPEC §1)', () => {
  it('S-01/S-05/U-14/U-23/U-25: 항목이 0개여도 입력창·카운트·필터 3개가 있고 카운트는 "0"', () => {
    render(<App />);

    expect(input()).toBeTruthy();
    expect(items()).toHaveLength(0);
    expect(count()).toBe('0');
    const f = filters();
    expect(f.all).toBeTruthy();
    expect(f.active).toBeTruthy();
    expect(f.completed).toBeTruthy();
    expect(f.all.getAttribute('aria-pressed')).toBe('true');
  });

  it('S-02/S-03/S-06/U-12: 항목 하나마다 제목·체크박스·삭제버튼이 그 항목 안에 하나씩 있다', async () => {
    render(<App />);
    await add('우유');
    await add('빵');

    expect(items()).toHaveLength(2);
    for (const item of items()) {
      expect(within(item).getAllByTestId('todo-title')).toHaveLength(1);
      expect(within(item).getAllByTestId('todo-toggle')).toHaveLength(1);
      expect(within(item).getAllByTestId('todo-delete')).toHaveLength(1);
    }
  });
});

describe('추가 (SPEC §2.1)', () => {
  it('U-01/U-02/U-09: Enter 로 추가되고, 새 항목은 맨 뒤에 미완료로 붙는다', async () => {
    render(<App />);
    await add('A');
    await add('B');

    expect(titles()).toEqual(['A', 'B']);
    expect(toggles().map((t) => t.checked)).toEqual([false, false]);
  });

  it('U-03: 추가에 성공하면 입력창이 비워진다', async () => {
    render(<App />);
    await add('A');

    expect(input().value).toBe('');
  });

  it('U-04: 앞뒤 공백은 제거되어 저장된다', async () => {
    render(<App />);
    await add('   우유   ');

    expect(titles()).toEqual(['우유']);
  });

  it('U-05: 빈 입력과 공백만 입력은 항목을 만들지 않는다', async () => {
    render(<App />);
    await user.click(input());
    await user.type(input(), '{Enter}');
    expect(items()).toHaveLength(0);

    await user.type(input(), '   {Enter}');
    expect(items()).toHaveLength(0);
  });

  it('U-06: 추가가 거절되면 입력창 값이 그대로 유지된다', async () => {
    render(<App />);
    await user.click(input());
    await user.type(input(), '   {Enter}');

    expect(input().value).toBe('   ');
  });

  it('U-07: 같은 제목을 두 번 추가하면 항목이 2개가 된다', async () => {
    render(<App />);
    await add('우유');
    await add('우유');

    expect(items()).toHaveLength(2);
    expect(titles()).toEqual(['우유', '우유']);
  });

  it('U-08: 제목 길이에 상한이 없다', async () => {
    render(<App />);
    const long = '가'.repeat(500);
    // 500자를 한 글자씩 치면 느리므로 붙여넣기로 넣는다.
    await user.click(input());
    await user.paste(long);
    await user.keyboard('{Enter}');

    expect(titles()).toEqual([long]);
  });

  it('U-10: 제목이 같아도 항목은 각각 독립적으로 토글·삭제된다', async () => {
    render(<App />);
    await add('같은 제목');
    await add('같은 제목');

    await user.click(toggles()[0]);
    expect(toggles().map((t) => t.checked)).toEqual([true, false]);

    await user.click(deletes()[0]);
    expect(titles()).toEqual(['같은 제목']);
    expect(toggles()[0].checked).toBe(false);
  });
});

describe('표시 (SPEC §2.2)', () => {
  it('U-11: todo-title 의 텍스트는 제목과 정확히 같다(장식 없음)', async () => {
    render(<App />);
    await add('우유 사기');
    await user.click(toggles()[0]);

    // 완료 상태여도 제목 텍스트는 바뀌지 않는다.
    expect(screen.getByTestId('todo-title').textContent).toBe('우유 사기');
  });

  it('U-13: todo-item 의 DOM 순서가 목록 순서와 같다', async () => {
    render(<App />);
    await add('1번');
    await add('2번');
    await add('3번');

    expect(titles()).toEqual(['1번', '2번', '3번']);
    expect(items().map((i) => within(i).getByTestId('todo-title').textContent)).toEqual([
      '1번',
      '2번',
      '3번',
    ]);
  });
});

describe('토글·삭제 (SPEC §2.3)', () => {
  it('U-15/U-16: 토글은 체크박스이고 클릭할 때마다 완료 상태가 반전된다', async () => {
    render(<App />);
    await add('A');

    const box = toggles()[0];
    expect(box.tagName).toBe('INPUT');
    expect(box.type).toBe('checkbox');
    expect(box.checked).toBe(false);

    await user.click(toggles()[0]);
    expect(toggles()[0].checked).toBe(true);

    await user.click(toggles()[0]);
    expect(toggles()[0].checked).toBe(false);
  });

  it('U-17: 한 항목을 토글해도 다른 항목의 상태와 순서는 그대로다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');

    await user.click(toggles()[1]);

    expect(toggles().map((t) => t.checked)).toEqual([false, true, false]);
    expect(titles()).toEqual(['A', 'B', 'C']);
  });

  it('U-18/U-19: 삭제 버튼은 그 항목만 지우고 남은 순서를 보존한다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await add('C');

    expect(deletes()[0].tagName).toBe('BUTTON');
    await user.click(deletes()[1]);

    expect(titles()).toEqual(['A', 'C']);
  });

  it('U-20: 삭제·토글에 확인 대화상자가 없다', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    await add('A');

    await user.click(toggles()[0]);
    await user.click(deletes()[0]);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(items()).toHaveLength(0);
  });
});

describe('카운트 (SPEC §2.4)', () => {
  it('U-21/U-24: 카운트 텍스트는 미완료 개수의 숫자 그 자체이고 즉시 갱신된다', async () => {
    render(<App />);
    expect(count()).toBe('0');

    await add('A');
    expect(count()).toBe('1');

    await add('B');
    expect(count()).toBe('2');

    await user.click(toggles()[0]);
    expect(count()).toBe('1');

    await user.click(deletes()[1]);
    expect(count()).toBe('0');
  });

  it('U-22: 카운트는 현재 필터와 무관하게 전체 미완료 개수를 센다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggles()[0]);

    await user.click(filters().completed);
    expect(titles()).toEqual(['A']);
    expect(count()).toBe('1');

    await user.click(filters().active);
    expect(titles()).toEqual(['B']);
    expect(count()).toBe('1');
  });
});

describe('필터 (SPEC §2.5)', () => {
  it('U-25/U-26/U-27/U-28/U-32: 초기는 전체이고 각 필터가 해당 항목만 보여준다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggles()[0]);

    expect(titles()).toEqual(['A', 'B']);

    await user.click(filters().active);
    expect(titles()).toEqual(['B']);
    expect(filters().active.getAttribute('aria-pressed')).toBe('true');
    expect(filters().all.getAttribute('aria-pressed')).toBe('false');
    expect(filters().completed.getAttribute('aria-pressed')).toBe('false');

    await user.click(filters().completed);
    expect(titles()).toEqual(['A']);
    expect(filters().completed.getAttribute('aria-pressed')).toBe('true');

    await user.click(filters().all);
    expect(titles()).toEqual(['A', 'B']);
    expect(filters().all.getAttribute('aria-pressed')).toBe('true');
  });

  it('U-29: 추가·토글·삭제 후에도 선택한 필터가 유지된다', async () => {
    render(<App />);
    await add('A');
    await user.click(filters().completed);

    await add('B');
    expect(filters().completed.getAttribute('aria-pressed')).toBe('true');
    expect(titles()).toEqual([]); // B 는 미완료라 완료 필터에서 보이지 않는다

    await user.click(filters().all);
    await user.click(filters().active);
    await user.click(deletes()[0]);
    expect(filters().active.getAttribute('aria-pressed')).toBe('true');
  });

  it('U-30: 필터 조건에서 벗어나면 목록에서 즉시 사라진다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(filters().active);
    expect(items()).toHaveLength(2);

    await user.click(toggles()[0]);
    expect(titles()).toEqual(['B']);
  });

  it('U-31: 필터 버튼은 button 이고 disabled 가 아니며 다시 눌러도 동작한다', async () => {
    render(<App />);
    await add('A');

    for (const button of Object.values(filters())) {
      expect(button.tagName).toBe('BUTTON');
      expect((button as HTMLButtonElement).disabled).toBe(false);
    }

    await user.click(filters().all);
    await user.click(filters().all);
    expect(titles()).toEqual(['A']);
  });

  it('U-33: 필터를 바꿔도 제목·완료 상태·개수는 변하지 않는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggles()[0]);

    await user.click(filters().active);
    await user.click(filters().completed);
    await user.click(filters().all);

    expect(titles()).toEqual(['A', 'B']);
    expect(toggles().map((t) => t.checked)).toEqual([true, false]);
    expect(count()).toBe('1');
  });
});

describe('상태의 수명 (SPEC §2.6)', () => {
  it('U-34: 언마운트 후 다시 렌더해도 목록과 완료 상태가 살아남는다', async () => {
    render(<App />);
    await add('A');
    await add('B');
    await user.click(toggles()[0]);

    cleanup();
    render(<App />);

    expect(titles()).toEqual(['A', 'B']);
    expect(toggles().map((t) => t.checked)).toEqual([true, false]);
    expect(count()).toBe('1');
    // 필터는 저장하지 않으므로 다시 전체로 시작한다.
    expect(filters().all.getAttribute('aria-pressed')).toBe('true');
  });

  it('U-34 보강: 저장된 값이 깨져 있으면 빈 목록으로 시작한다', () => {
    localStorage.setItem('todo.items.v1', '{ 깨진 값');
    render(<App />);

    expect(items()).toHaveLength(0);
    expect(count()).toBe('0');
  });

  it('U-35: StrictMode 이중 렌더에서도 항목이 중복 생성되지 않는다', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await add('A');

    expect(titles()).toEqual(['A']);

    await add('B');
    expect(titles()).toEqual(['A', 'B']);
    // id 가 겹치면 React 가 key 중복을 경고하며 렌더가 어긋난다 — 항목 수로 확인한다.
    expect(items()).toHaveLength(2);
  });

  it('U-36/S-15: 소스에 네트워크·타이머·대화상자 호출이 없다', () => {
    const dir = join(ROOT, 'src');
    const sources = readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.spec.tsx'))
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n');

    for (const forbidden of [
      'fetch(',
      'XMLHttpRequest',
      'axios',
      'setTimeout',
      'setInterval',
      'confirm(',
      'alert(',
    ]) {
      expect(sources.includes(forbidden)).toBe(false);
    }
  });
});

describe('범위 밖 (SPEC §1: S-15·S-16)', () => {
  it('S-15: 화면의 input·button 전수가 계약이 요구한 것뿐이다(일괄완료·검색·테마 등 없음)', async () => {
    const { container } = render(<App />);
    await add('A');
    await add('B');

    // input = 입력창 1개 + 항목마다 체크박스 1개
    const allInputs = [...container.querySelectorAll('input')];
    expect(allInputs).toHaveLength(1 + 2);
    expect(allInputs.filter((el) => el.type === 'checkbox')).toHaveLength(2);
    // 날짜·우선순위·태그·검색 입력이 없다
    expect(allInputs.filter((el) => ['date', 'search', 'number'].includes(el.type))).toHaveLength(0);
    expect(container.querySelectorAll('select')).toHaveLength(0);

    // button = 필터 3개 + 항목마다 삭제 1개
    expect(container.querySelectorAll('button')).toHaveLength(3 + 2);
  });

  it('S-15: 제목을 더블클릭해도 편집 입력창이 생기지 않는다', async () => {
    const { container } = render(<App />);
    await add('A');

    await user.dblClick(screen.getByTestId('todo-title'));

    expect(container.querySelectorAll('input')).toHaveLength(2); // 입력창 + 체크박스
    expect(screen.getByTestId('todo-title').textContent).toBe('A');
    expect(container.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('S-16: 로케일 전환 컨트롤이 없고 화면 문구가 한국어 하나다', async () => {
    const { container } = render(<App />);
    await add('A');

    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(['삭제', '전체', '미완료', '완료']);
    expect(container.querySelector('[lang]')).toBeNull();
  });
});
