import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import App from '../../src/App'

test('EV9: App 렌더 — CartList의 목록과 합계가 렌더된다', () => {
  render(<App />)
  expect(screen.getAllByRole('list')).toHaveLength(1)
  expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  expect(screen.getByTestId('cart-total')).toBeTruthy()
})
