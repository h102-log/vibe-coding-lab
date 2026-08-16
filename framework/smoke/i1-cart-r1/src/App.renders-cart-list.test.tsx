/**
 * 지키는 요구 (SPEC.md §1):
 * - S1 "`src/CartList.tsx`가 CartList 컴포넌트를 정의하고, `src/App.tsx`가 CartList를 렌더한다."
 */
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

test('App 은 CartList 를 렌더한다 (S1)', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '장바구니' })).toBeTruthy();

  const lines = screen.getAllByRole('listitem');
  expect(lines.length).toBeGreaterThanOrEqual(2);
  expect(within(lines[0]).getAllByRole('button')).toHaveLength(2);
});
