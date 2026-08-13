/**
 * 지키는 요구 (과제 명세. 이 저장소에는 SPEC.md가 없어 과제 문장을 그대로 인용한다):
 *
 *   "src/TagInput.tsx 에 태그 입력 컴포넌트 TagInput을 구현하고, src/App.tsx 가 그것을 렌더하게 한다"
 *
 * App이 TagInput을 렌더에서 빠뜨려도 TagInput 자체 테스트는 모두 통과하므로, 배선을 따로 지킨다.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

afterEach(cleanup);

describe('App', () => {
  it('TagInput을 렌더한다 — 입력창과 빈 목록 상태가 보인다', () => {
    render(<App />);

    expect(screen.getByLabelText('태그 입력')).toBeTruthy();
    expect(screen.getByText('태그 없음')).toBeTruthy();
  });

  it('App을 통해서도 태그 추가가 동작한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('태그 입력'), 'react{Enter}');

    expect(screen.getByText('react')).toBeTruthy();
  });
});
