/**
 * 지키는 요구 (이 프로젝트에는 SPEC.md 가 없어 과제 요구 문장을 인용한다):
 *
 *   5. "태그가 0개일 때는 목록 대신 \"태그 없음\" 텍스트를 렌더한다."
 *
 * 즉 이 파일은 (a) 처음 상태에서 "태그 없음" 이 보이고 목록은 렌더되지 않는다는 것,
 * (b) 태그가 생기면 "태그 없음" 이 사라지고 목록이 렌더된다는 것,
 * (c) 태그를 모두 제거하면 다시 "태그 없음" 으로 돌아간다는 것을 지킨다.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

describe('TagInput: 태그 0개일 때', () => {
  it('처음에는 목록 대신 "태그 없음" 을 렌더한다', () => {
    render(<TagInput />);

    expect(screen.getByText('태그 없음')).toBeDefined();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('태그가 하나라도 있으면 "태그 없음" 대신 목록을 렌더한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(screen.getByRole('textbox'), 'react{Enter}');

    expect(screen.queryByText('태그 없음')).toBeNull();
    expect(screen.getByRole('list')).toBeDefined();
  });

  it('태그를 모두 제거하면 다시 "태그 없음" 을 렌더한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'react{Enter}');
    await user.type(input, 'vite{Enter}');

    await user.click(screen.getByRole('button', { name: 'react 삭제' }));
    await user.click(screen.getByRole('button', { name: 'vite 삭제' }));

    expect(screen.getByText('태그 없음')).toBeDefined();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
