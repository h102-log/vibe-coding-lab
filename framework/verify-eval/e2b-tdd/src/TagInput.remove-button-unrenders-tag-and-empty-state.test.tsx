/**
 * TagInput — 태그 제거 버튼과 빈 목록 상태를 지킨다.
 *
 * 이 저장소에 SPEC.md는 없어서, 구현 지시서의 요구 문장을 그대로 인용해 둔다:
 *
 *   4. "각 태그 옆에 제거 버튼이 있고, 누르면 그 태그만 목록에서 사라진다(숨김이 아니라 언렌더)."
 *   5. "태그가 0개일 때는 목록 대신 \"태그 없음\" 텍스트를 렌더한다."
 *
 * 4번의 "숨김이 아니라 언렌더"는 queryByText가 null인지로 확인한다 —
 * Testing Library의 텍스트 질의는 CSS로 숨긴 노드도 찾아내므로, null이면 DOM에 없다는 뜻이다.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

afterEach(cleanup);

/** 태그 텍스트가 들어 있는 목록 항목 안의 제거 버튼을 찾는다(버튼 라벨에 의존하지 않는다). */
function removeButtonFor(tag: string) {
  const item = screen.getByText(tag).closest('li');
  if (item === null) throw new Error(`태그 "${tag}"의 목록 항목을 찾지 못했다`);
  return within(item as HTMLElement).getByRole('button');
}

async function addTags(user: ReturnType<typeof userEvent.setup>, ...tags: string[]) {
  for (const tag of tags) {
    await user.type(screen.getByRole('textbox'), `${tag}{Enter}`);
  }
}

describe('요구 4 — 제거 버튼은 그 태그만 언렌더한다', () => {
  it('태그마다 버튼이 하나씩 있다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react', 'vite');

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('제거 버튼을 누르면 그 태그만 DOM에서 사라지고 나머지는 남는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react', 'vite', 'vitest');
    await user.click(removeButtonFor('vite'));

    expect(screen.queryByText('vite')).toBeNull();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'react제거',
      'vitest제거',
    ]);
  });

  it('제거한 태그는 다시 추가할 수 있다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react');
    await user.click(removeButtonFor('react'));
    await addTags(user, 'react');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('react')).not.toBeNull();
  });
});

describe('요구 5 — 태그가 0개면 "태그 없음"을 렌더한다', () => {
  it('초기 상태에서는 목록 대신 "태그 없음"을 렌더한다', () => {
    render(<TagInput />);

    expect(screen.getByText('태그 없음')).not.toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('태그가 있으면 "태그 없음"을 렌더하지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react');

    expect(screen.queryByText('태그 없음')).toBeNull();
    expect(screen.queryByRole('list')).not.toBeNull();
  });

  it('마지막 태그를 제거하면 다시 "태그 없음"으로 돌아간다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react');
    await user.click(removeButtonFor('react'));

    expect(screen.getByText('태그 없음')).not.toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
