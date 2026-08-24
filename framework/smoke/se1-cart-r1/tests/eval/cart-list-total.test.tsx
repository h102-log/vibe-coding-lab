import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import CartList from '../../src/CartList'

const ESPRESSO = '에스프레소 원두 200g'
const DRIPPER = '드리퍼'

const rows = () => screen.queryAllByRole('listitem')
const total = () => screen.getByTestId('cart-total').textContent
const minus = (name: string) => screen.getByRole('button', { name: `${name} 수량 감소` })
const plus = (name: string) => screen.getByRole('button', { name: `${name} 수량 증가` })

// 각 줄의 첫 버튼이 감소 버튼이다(스테퍼는 −, + 순서로 렌더된다).
async function emptyTheCart(user: ReturnType<typeof userEvent.setup>) {
  for (let guard = 0; guard < 20 && rows().length > 0; guard++) {
    await user.click(within(rows()[0]).getAllByRole('button')[0])
  }
}

test('EV7: 초기 렌더 — 목록 뒤에 전체 합계가 렌더된다', () => {
  render(<CartList />)
  const list = screen.getByRole('list')
  const totalEl = screen.getByTestId('cart-total')
  const after = list.compareDocumentPosition(totalEl) & Node.DOCUMENT_POSITION_FOLLOWING
  expect(after).toBeGreaterThan(0)
  expect(totalEl.textContent).toBe('56,000원')
})

test('EV11: 수량 0이 된 줄은 합계에 기여하지 않는다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  expect(total()).toBe('56,000원')
  await user.click(minus(DRIPPER)) // 18,500원 × 1 이 빠진다
  expect(total()).toBe('37,500원')
})

test('EV17: + 1회 클릭 — 합계가 그 항목 단가만큼 늘어난다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await user.click(plus(ESPRESSO)) // 12,000원 이 더해진다
  expect(total()).toBe('68,000원')
})

test('EV18: 담긴 항목이 없으면 줄이 사라지고 빈 상태 텍스트가 렌더된다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await emptyTheCart(user)
  expect(rows()).toHaveLength(0)
  expect(screen.getByText('담은 항목이 없습니다')).toBeTruthy()
})

test('EV19: 담긴 항목이 없으면 합계가 0원으로 렌더된다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await emptyTheCart(user)
  expect(total()).toBe('0원')
})

test('EV20: 금액이 천 단위 쉼표 + 원 형식으로 렌더된다', () => {
  render(<CartList />)
  expect(total()).toMatch(/^\d{1,3}(,\d{3})*원$/)
  expect(within(rows()[0]).getByTestId('unit-price').textContent).toMatch(/^\d{1,3}(,\d{3})*원$/)
})

test('EV22: 합계 줄에 «합계» 레이블이 렌더된다', () => {
  render(<CartList />)
  expect(screen.getByText('합계')).toBeTruthy()
})
