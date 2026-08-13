/**
 * 지키는 요구 (이 프로젝트에는 SPEC.md 가 없어 과제 요구 문장을 인용한다):
 *
 *   4. "각 태그 옆에 제거 버튼이 있고, 누르면 그 태그만 목록에서 사라진다(숨김이 아니라 언렌더)."
 *
 * 즉 이 파일은 (a) 태그 개수만큼 제거 버튼이 있다는 것, (b) 누른 태그만 사라진다는 것,
 * (c) 사라진 태그가 DOM 에 남아 CSS 로 숨겨진 게 아니라 언렌더된다는 것을 지킨다.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

async function addTags(user: ReturnType<typeof userEvent.setup>, ...tags: string[]) {
  const input = screen.getByRole('textbox');
  for (const tag of tags) {
    await user.type(input, `${tag}{Enter}`);
  }
}

describe('TagInput: 제거 버튼', () => {
  it('태그마다 제거 버튼이 하나씩 있다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react', 'vite', 'vitest');

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('제거 버튼을 누르면 그 태그만 사라지고 나머지는 남는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    await addTags(user, 'react', 'vite', 'vitest');

    await user.click(screen.getByRole('button', { name: 'vite 삭제' }));

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'react×',
      'vitest×',
    ]);
  });

  it('제거된 태그는 숨겨지는 게 아니라 DOM 에서 언렌더된다', async () => {
    const user = userEvent.setup();
    const { container } = render(<TagInput />);
    await addTags(user, 'react', 'vite');

    await user.click(screen.getByRole('button', { name: 'vite 삭제' }));

    // queryByText 는 숨김 요소도 찾으므로 null 이면 노드 자체가 없다는 뜻이다.
    expect(screen.queryByText('vite')).toBeNull();
    expect(screen.queryByRole('button', { name: 'vite 삭제' })).toBeNull();
    expect(container.textContent).not.toContain('vite');
  });

  it('제거한 태그는 다시 추가할 수 있다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    await addTags(user, 'react');

    await user.click(screen.getByRole('button', { name: 'react 삭제' }));
    await addTags(user, 'react');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('react')).toBeDefined();
  });
});
