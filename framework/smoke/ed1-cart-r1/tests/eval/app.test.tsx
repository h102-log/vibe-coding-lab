import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from '../../src/App'

afterEach(cleanup)

describe('App', () => {
  it('EV12: App 을 렌더하면 CartList 가 렌더된다 — 항목 줄과 전체 합계가 문서에 있다', () => {
    render(<App />)
    expect(screen.queryAllByTestId('cart-row').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('cart-total')).not.toBeNull()
  })
})
