/**
 * 지키는 요구 (이 프로젝트에는 SPEC.md 가 없어 과제 요구 문장을 인용한다):
 *
 *   2. "태그는 앞뒤 공백을 제거해 저장하고, 공백 제거 후 빈 문자열이면 추가하지 않는다."
 *   3. "이미 있는 태그와 같은 값이면(공백 제거 후 비교) 다시 추가하지 않는다."
 *
 * 즉 이 파일은 빈 입력·공백만 있는 입력이 태그가 되지 않는다는 것과,
 * 중복 태그가 (앞뒤 공백 차이를 무시하고) 두 번 들어가지 않는다는 것을 지킨다.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

describe('TagInput: 빈 값·중복 값 거부', () => {
  it('빈 입력에서 Enter 를 눌러도 태그가 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(screen.getByRole('textbox'), '{Enter}');

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('공백만 입력하고 Enter 를 눌러도 태그가 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(screen.getByRole('textbox'), '     {Enter}');

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('이미 있는 태그와 같은 값은 다시 추가하지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'react{Enter}');
    await user.type(input, 'react{Enter}');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('공백 차이만 있는 값도 중복으로 보고 추가하지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'react{Enter}');
    await user.type(input, '   react   {Enter}');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('react')).toBeDefined();
  });

  it('중복이 거부돼도 다른 태그 추가는 계속 동작한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'react{Enter}');
    await user.type(input, 'react{Enter}');
    await user.type(input, 'vite{Enter}');

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'react×',
      'vite×',
    ]);
  });
});
