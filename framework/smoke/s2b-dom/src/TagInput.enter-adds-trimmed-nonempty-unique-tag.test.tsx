/**
 * 지키는 요구 (과제 명세 2·3항. 이 저장소에는 SPEC.md가 없어 과제 문장을 그대로 인용한다):
 *
 *   "입력창에서 Enter를 누르면 입력값이 태그로 추가되고 입력창은 비워진다.
 *    태그는 앞뒤 공백을 제거해 저장하고, 공백 제거 후 빈 문자열이면 추가하지 않는다."
 *   "이미 있는 태그와 같은 값이면(공백 제거 후 비교) 다시 추가하지 않는다."
 *
 * 명세가 정하지 않아 구현이 택한 것(= 이 테스트가 고정하는 것):
 *   - 중복 입력도 Enter를 누르면 입력창은 비워진다(입력이 소비된 것으로 본다).
 *   - 공백뿐인 입력은 추가도, 입력창 비우기도 하지 않는다(아무 일도 일어나지 않는다).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from './TagInput';

afterEach(cleanup);

function tagInput() {
  return screen.getByLabelText('태그 입력');
}

function tagTexts() {
  return screen.queryAllByRole('listitem').map((li) => li.textContent);
}

describe('Enter 입력으로 태그 추가', () => {
  it('Enter를 누르면 입력값이 태그로 추가되고 입력창이 비워진다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(tagInput(), 'react{Enter}');

    expect(screen.getByRole('listitem')).toBeTruthy();
    expect(screen.getByText('react')).toBeTruthy();
    expect(tagInput()).toHaveProperty('value', '');
  });

  it('앞뒤 공백을 제거해 저장한다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(tagInput(), '   react   {Enter}');

    expect(screen.getByText('react')).toBeTruthy();
    expect(screen.queryByText('   react   ')).toBeNull();
  });

  it('공백 제거 후 빈 문자열이면 추가하지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(tagInput(), '{Enter}');
    await user.type(tagInput(), '     {Enter}');

    expect(tagTexts()).toHaveLength(0);
    expect(screen.getByText('태그 없음')).toBeTruthy();
  });

  it('이미 있는 태그와 같은 값이면(공백 제거 후 비교) 다시 추가하지 않는다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(tagInput(), 'react{Enter}');
    await user.type(tagInput(), '  react  {Enter}');

    expect(screen.getAllByText('react')).toHaveLength(1);
    expect(tagTexts()).toHaveLength(1);
    expect(tagInput()).toHaveProperty('value', '');
  });

  it('서로 다른 값은 입력 순서대로 모두 추가된다', async () => {
    const user = userEvent.setup();
    render(<TagInput />);

    await user.type(tagInput(), 'react{Enter}');
    await user.type(tagInput(), 'vite{Enter}');
    await user.type(tagInput(), 'vitest{Enter}');

    expect(tagTexts()).toEqual(['react제거', 'vite제거', 'vitest제거']);
  });
});
