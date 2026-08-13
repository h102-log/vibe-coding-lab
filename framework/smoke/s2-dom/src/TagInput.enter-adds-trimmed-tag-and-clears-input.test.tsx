/**
 * 지키는 요구 (이 프로젝트에는 SPEC.md 가 없어 과제 요구 문장을 인용한다):
 *
 *   1. "텍스트 입력창 1개와 추가된 태그 목록을 렌더한다."
 *   2. "입력창에서 Enter를 누르면 입력값이 태그로 추가되고 입력창은 비워진다.
 *       태그는 앞뒤 공백을 제거해 저장하고"
 *
 * 즉 이 파일은 (a) 입력창이 정확히 1개라는 것, (b) Enter 가 입력값을 태그로 만든다는 것,
 * (c) 저장되는 값이 trim 된 값이라는 것, (d) 추가 후 입력창이 비워진다는 것을 지킨다.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

describe('TagInput: Enter 로 태그 추가', () => {
  it('텍스트 입력창을 1개 렌더한다', () => {
    render(<TagInput />);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('Enter 를 누르면 입력값이 태그 목록에 추가된다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(screen.getByRole('textbox'), 'react{Enter}');

    expect(screen.getByRole('listitem').textContent).toContain('react');
  });

  it('태그는 앞뒤 공백을 제거해 저장한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(screen.getByRole('textbox'), '   react   {Enter}');

    // Testing Library 의 기본 normalizer 는 앞뒤 공백을 잘라내므로,
    // 항등 normalizer 를 넘겨야 "저장된 값이 정말 trim 됐는지" 를 검사할 수 있다.
    const raw = (text: string) => text;
    expect(screen.getByText('react', { normalizer: raw })).toBeDefined();
    expect(screen.queryByText('   react   ', { normalizer: raw })).toBeNull();
  });

  it('태그가 추가되면 입력창이 비워진다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    await user.type(input, '  react  {Enter}');

    expect(input.value).toBe('');
  });

  it('Enter 를 여러 번 누르면 입력한 순서대로 태그가 쌓인다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'react{Enter}');
    await user.type(input, 'vite{Enter}');
    await user.type(input, 'vitest{Enter}');

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'react×',
      'vite×',
      'vitest×',
    ]);
  });
});
