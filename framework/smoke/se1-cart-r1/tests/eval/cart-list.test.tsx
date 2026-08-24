import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import CartList from '../../src/CartList'

const ESPRESSO = '에스프레소 원두 200g'
const DRIPPER = '드리퍼'
const FILTER = '종이 필터 100매'

const rows = () => screen.queryAllByRole('listitem')
const row = (i: number) => rows()[i]
const qtyOf = (el: HTMLElement) => within(el).getByTestId('qty').textContent
const subtotalOf = (el: HTMLElement) => within(el).getByTestId('subtotal').textContent
const plus = (name: string) => screen.getByRole('button', { name: `${name} 수량 증가` })
const minus = (name: string) => screen.getByRole('button', { name: `${name} 수량 감소` })

test('EV1: 초기 렌더 — 시작 데이터 수만큼 항목 줄이 렌더된다', () => {
  render(<CartList />)
  expect(rows()).toHaveLength(3)
})

test('EV2: 초기 렌더 — 첫 줄에 이름·단가·수량·소계가 모두 렌더된다', () => {
  render(<CartList />)
  const first = row(0)
  expect(within(first).getByText(ESPRESSO)).toBeTruthy()
  expect(within(first).getByTestId('unit-price').textContent).toBe('12,000원')
  expect(qtyOf(first)).toBe('2')
  expect(subtotalOf(first)).toBe('24,000원')
})

test('EV3: 초기 렌더 — 각 줄에 버튼이 정확히 2개 렌더된다', () => {
  render(<CartList />)
  for (const r of rows()) expect(within(r).getAllByRole('button')).toHaveLength(2)
})

test('EV4: 초기 렌더 — 스테퍼 버튼의 표시 텍스트가 비어 있다(아이콘만)', () => {
  render(<CartList />)
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBeGreaterThan(0)
  for (const b of buttons) expect(b.textContent).toBe('')
})

test('EV5: + 1회 클릭 — 그 줄의 수량이 1 오르고 소계가 갱신된다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await user.click(plus(ESPRESSO))
  expect(qtyOf(row(0))).toBe('3')
  expect(subtotalOf(row(0))).toBe('36,000원')
})

test('EV6: 수량 2인 줄의 − 1회 클릭 — 수량이 1 내리고 소계가 갱신된다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await user.click(minus(ESPRESSO))
  expect(qtyOf(row(0))).toBe('1')
  expect(subtotalOf(row(0))).toBe('12,000원')
})

test('EV8: props 없이 렌더 — 하드코딩 시작 항목이 2~3줄 렌더된다', () => {
  render(<CartList />)
  expect(rows().length).toBeGreaterThanOrEqual(2)
  expect(rows().length).toBeLessThanOrEqual(3)
})

test('EV10: 수량 1인 줄의 − 1회 클릭 — 그 줄이 언렌더된다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  expect(screen.getByText(DRIPPER)).toBeTruthy()
  await user.click(minus(DRIPPER))
  expect(screen.queryByText(DRIPPER)).toBeNull()
})

test('EV12: 각 스테퍼 버튼이 aria-hidden 인라인 svg 아이콘 1개를 갖는다', () => {
  render(<CartList />)
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBeGreaterThan(0)
  for (const b of buttons) {
    const icons = b.querySelectorAll('svg[aria-hidden="true"]')
    expect(icons).toHaveLength(1)
  }
})

test('EV13: 각 항목마다 이름이 들어간 증가·감소 버튼이 하나씩 조회된다', () => {
  render(<CartList />)
  for (const name of [ESPRESSO, DRIPPER, FILTER]) {
    expect(screen.getAllByRole('button', { name: `${name} 수량 증가` })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: `${name} 수량 감소` })).toHaveLength(1)
  }
})

test('EV14: Tab 키만으로 첫 줄 증가 버튼에 포커스가 닿는다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await user.tab()
  await user.tab()
  expect(document.activeElement).toBe(plus(ESPRESSO))
})

test('EV15: 포커스된 증가 버튼에 Enter — 수량이 1 오른다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await user.tab()
  await user.tab()
  await user.keyboard('{Enter}')
  expect(qtyOf(row(0))).toBe('3')
})

test('EV16: 수량이 0 아래로 내려가지 않는다 — 음수 수량이 렌더되지 않는다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  await user.click(minus(DRIPPER))
  for (const r of rows()) expect(Number(qtyOf(r))).toBeGreaterThan(0)
  expect(document.body.textContent ?? '').not.toMatch(/-\s*\d/)
})

test('EV21: 목록이 ul/li 로 렌더된다', () => {
  render(<CartList />)
  const list = screen.getByRole('list')
  expect(list.tagName).toBe('UL')
  for (const r of rows()) expect(r.tagName).toBe('LI')
})

test('EV23: 한 줄의 + 는 다른 줄의 수량·소계를 바꾸지 않는다', async () => {
  const user = userEvent.setup()
  render(<CartList />)
  const before = { qty: qtyOf(row(1)), subtotal: subtotalOf(row(1)) }
  await user.click(plus(ESPRESSO))
  expect(qtyOf(row(1))).toBe(before.qty)
  expect(subtotalOf(row(1))).toBe(before.subtotal)
})

test('EV24: 언마운트 후 재렌더 — 수량이 하드코딩 초기값으로 돌아온다', async () => {
  const user = userEvent.setup()
  const { unmount } = render(<CartList />)
  await user.click(plus(ESPRESSO))
  expect(qtyOf(row(0))).toBe('3')
  unmount()
  render(<CartList />)
  expect(qtyOf(row(0))).toBe('2')
})
