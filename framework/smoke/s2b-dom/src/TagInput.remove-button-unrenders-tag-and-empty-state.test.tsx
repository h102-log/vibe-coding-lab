/**
 * 지키는 요구 (과제 명세 1·4·5항. 이 저장소에는 SPEC.md가 없어 과제 문장을 그대로 인용한다):
 *
 *   "텍스트 입력창 1개와 추가된 태그 목록을 렌더한다."
 *   "각 태그 옆에 제거 버튼이 있고, 누르면 그 태그만 목록에서 사라진다(숨김이 아니라 언렌더)."
 *   "태그가 0개일 때는 목록 대신 '태그 없음' 텍스트를 렌더한다."
 *
 * '숨김이 아니라 언렌더'는 queryBy*로 검증한다 — RTL의 ByText/ByRole 조회는 CSS로 숨겨진
 * 요소도 찾아내므로, null이 나온다는 것은 DOM에서 실제로 제거됐다는 뜻이다.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

afterEach(cleanup);

function tagInput() {
  return screen.getByLabelText('태그 입력');
}

async function addTags(user: ReturnType<typeof userEvent.setup>, ...tags: string[]) {
  for (const tag of tags) {
    await user.type(tagInput(), `${tag}{Enter}`);
  }
}

describe('태그 목록 렌더와 제거', () => {
  it('텍스트 입력창을 정확히 1개 렌더한다', () => {
    render(<TagInput />);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('태그가 0개면 목록 대신 "태그 없음"을 렌더한다', () => {
    render(<TagInput />);

    expect(screen.getByText('태그 없음')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('태그가 생기면 "태그 없음" 대신 목록을 렌더한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react');

    expect(screen.queryByText('태그 없음')).toBeNull();
    expect(screen.getByRole('list')).toBeTruthy();
  });

  it('제거 버튼을 누르면 그 태그만 DOM에서 사라진다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    await addTags(user, 'react', 'vite', 'vitest');

    await user.click(screen.getByRole('button', { name: 'vite 제거' }));

    expect(screen.queryByText('vite')).toBeNull();
    expect(screen.queryByRole('button', { name: 'vite 제거' })).toBeNull();
    expect(screen.getByText('react')).toBeTruthy();
    expect(screen.getByText('vitest')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('태그마다 제거 버튼이 하나씩 있다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await addTags(user, 'react', 'vite');

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('태그를 모두 제거하면 다시 "태그 없음"을 렌더한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    await addTags(user, 'react', 'vite');

    await user.click(screen.getByRole('button', { name: 'react 제거' }));
    await user.click(screen.getByRole('button', { name: 'vite 제거' }));

    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByText('태그 없음')).toBeTruthy();
  });

  it('제거한 태그는 다시 추가할 수 있다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    await addTags(user, 'react');
    await user.click(screen.getByRole('button', { name: 'react 제거' }));

    await addTags(user, 'react');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('react')).toBeTruthy();
  });
});
