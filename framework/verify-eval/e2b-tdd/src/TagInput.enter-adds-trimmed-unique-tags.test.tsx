/**
 * TagInput — 입력창에서 Enter를 눌렀을 때의 태그 추가 규칙을 지킨다.
 *
 * 이 저장소에 SPEC.md는 없어서, 구현 지시서의 요구 문장을 그대로 인용해 둔다:
 *
 *   1. "텍스트 입력창 1개와 추가된 태그 목록을 렌더한다."
 *   2. "입력창에서 Enter를 누르면 입력값이 태그로 추가되고 입력창은 비워진다.
 *       태그는 앞뒤 공백을 제거해 저장하고, 공백 제거 후 빈 문자열이면 추가하지 않는다."
 *   3. "이미 있는 태그와 같은 값이면(공백 제거 후 비교) 다시 추가하지 않는다."
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

afterEach(cleanup);

function textbox() {
  return screen.getByRole('textbox') as HTMLInputElement;
}

describe('요구 1 — 입력창과 태그 목록 렌더', () => {
  it('텍스트 입력창을 정확히 1개 렌더한다', () => {
    render(<TagInput />);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('추가된 태그들을 목록 항목으로 렌더한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), 'react{Enter}');
    await user.type(textbox(), 'vite{Enter}');

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'react제거',
      'vite제거',
    ]);
  });
});

describe('요구 2 — Enter로 추가하고 입력창을 비운다', () => {
  it('Enter를 누르면 입력값이 태그가 되고 입력창이 비워진다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), 'react{Enter}');

    expect(screen.getByText('react')).not.toBeNull();
    expect(textbox().value).toBe('');
  });

  it('앞뒤 공백을 제거한 값으로 저장한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), '   react   {Enter}');

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    // getByText는 공백을 정규화해 비교하므로, 저장된 원문 자체를 textContent로 확인한다.
    expect(items[0].textContent).toBe('react제거');
  });

  it('공백만 입력하면 태그를 추가하지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), '    {Enter}');

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('태그 없음')).not.toBeNull();
  });

  it('Enter가 아닌 입력만으로는 태그가 추가되지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), 'react');

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(textbox().value).toBe('react');
  });
});

describe('요구 3 — 중복 태그는 다시 추가하지 않는다', () => {
  it('같은 값을 다시 Enter해도 태그는 하나만 남는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), 'react{Enter}');
    await user.type(textbox(), 'react{Enter}');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('공백 제거 후 같은 값이면 중복으로 본다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), 'react{Enter}');
    await user.type(textbox(), '  react  {Enter}');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('다른 값이면 정상적으로 이어서 추가된다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(textbox(), 'react{Enter}');
    await user.type(textbox(), 'react-dom{Enter}');

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
