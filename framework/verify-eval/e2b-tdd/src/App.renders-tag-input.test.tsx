/**
 * App — TagInput을 렌더한다.
 *
 * 이 저장소에 SPEC.md는 없어서, 구현 지시서의 요구 문장을 그대로 인용해 둔다:
 *
 *   "src/TagInput.tsx 에 태그 입력 컴포넌트 TagInput을 구현하고, src/App.tsx 가 그것을 렌더하게 한다"
 *
 * App을 렌더한 것만으로 태그 입력이 동작하는지(입력창 + 빈 목록 텍스트 + Enter 추가)까지 확인한다.
 */
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

afterEach(cleanup);

it('App은 TagInput의 입력창과 빈 목록 텍스트를 렌더한다', () => {
  render(<App />);

  expect(screen.getAllByRole('textbox')).toHaveLength(1);
  expect(screen.getByText('태그 없음')).not.toBeNull();
});

it('App에서 바로 태그를 추가할 수 있다', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByRole('textbox'), 'react{Enter}');

  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByText('react')).not.toBeNull();
});
