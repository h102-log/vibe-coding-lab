import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import CartList from '../../src/CartList'

afterEach(cleanup)

// ── 관측 헬퍼 — DOM 계약 ────────────────────────────────────────────────────
// 줄: <li data-testid="cart-row" data-item-id="...">
// 셀: data-testid = item-name | unit-price | quantity | subtotal, 값은 data-value(숫자)
// 스테퍼: data-testid = decrement | increment
// 합계: data-testid="cart-total", 값은 data-value(숫자)
// data-value 는 «기계가 읽는 값», 텍스트의 숫자는 «사람이 보는 값» — 둘을 함께 대조한다.

const rows = () => screen.queryAllByTestId('cart-row')
const rowId = (row: HTMLElement) => row.getAttribute('data-item-id') ?? ''
const rowById = (id: string) => rows().find((r) => rowId(r) === id) ?? null
const cell = (row: HTMLElement, testId: string) => within(row).getByTestId(testId)
const value = (el: HTMLElement) => Number(el.getAttribute('data-value'))
const digits = (el: HTMLElement) => (el.textContent ?? '').replace(/\D/g, '')

const qty = (row: HTMLElement) => value(cell(row, 'quantity'))
const unitPrice = (row: HTMLElement) => value(cell(row, 'unit-price'))
const subtotal = (row: HTMLElement) => value(cell(row, 'subtotal'))
const total = () => value(screen.getByTestId('cart-total'))
const click = (row: HTMLElement, testId: string) =>
  fireEvent.click(within(row).getByTestId(testId))

describe('CartList', () => {
  it('EV1: 렌더하면 목록 1개와 하드코딩된 시작 항목 수(2~3)만큼의 줄이 그 목록 안에 렌더된다', () => {
    render(<CartList />)
    const list = screen.getByRole('list')
    const r = rows()
    expect(r.length).toBeGreaterThanOrEqual(2)
    expect(r.length).toBeLessThanOrEqual(3)
    for (const row of r) expect(list.contains(row)).toBe(true)
    expect(new Set(r.map(rowId)).size).toBe(r.length)
  })

  it('EV2: 각 줄에 항목 이름·단가·수량이 렌더된다 — 이름은 비어 있지 않고, 단가·수량은 표시 숫자가 값과 같다', () => {
    render(<CartList />)
    for (const row of rows()) {
      expect((cell(row, 'item-name').textContent ?? '').trim().length).toBeGreaterThan(0)
      expect(Number.isFinite(unitPrice(row))).toBe(true)
      expect(Number.isFinite(qty(row))).toBe(true)
      expect(digits(cell(row, 'unit-price'))).toBe(String(unitPrice(row)))
      expect(digits(cell(row, 'quantity'))).toBe(String(qty(row)))
    }
  })

  it('EV3: 각 줄의 소계가 그 줄의 수량 × 단가와 같다 — 값과 표시 숫자 모두', () => {
    render(<CartList />)
    for (const row of rows()) {
      expect(subtotal(row)).toBe(qty(row) * unitPrice(row))
      expect(digits(cell(row, 'subtotal'))).toBe(String(qty(row) * unitPrice(row)))
    }
  })

  it('EV4: 각 줄의 스테퍼는 버튼 정확히 2개(−, +)이고, 둘 다 접근 가능한 이름이 있으며 가시 텍스트 없이 아이콘 요소만 렌더한다', () => {
    render(<CartList />)
    for (const row of rows()) {
      const buttons = within(row).getAllByRole('button')
      expect(buttons.length).toBe(2)
      expect(buttons).toContain(within(row).getByTestId('decrement'))
      expect(buttons).toContain(within(row).getByTestId('increment'))
      for (const b of buttons) {
        expect((b.getAttribute('aria-label') ?? '').trim().length).toBeGreaterThan(0)
        expect((b.textContent ?? '').trim()).toBe('')
        expect(b.querySelector('svg')).not.toBeNull()
      }
    }
  })

  it('EV5: + 를 누르면 그 줄의 수량만 1 오르고 소계가 함께 갱신된다', () => {
    render(<CartList />)
    const target = rows()[0]
    const id = rowId(target)
    const before = qty(target)
    const others = rows()
      .filter((r) => rowId(r) !== id)
      .map((r) => [rowId(r), qty(r)] as const)

    click(target, 'increment')

    const after = rowById(id)!
    expect(qty(after)).toBe(before + 1)
    expect(subtotal(after)).toBe((before + 1) * unitPrice(after))
    for (const [otherId, otherQty] of others) expect(qty(rowById(otherId)!)).toBe(otherQty)
  })

  it('EV6: − 를 누르면 그 줄의 수량이 1 내려간다', () => {
    render(<CartList />)
    let id = rowId(rows().find((r) => qty(r) >= 2) ?? rows()[0])
    if (qty(rowById(id)!) < 2) click(rowById(id)!, 'increment')

    const before = qty(rowById(id)!)
    expect(before).toBeGreaterThanOrEqual(2)

    click(rowById(id)!, 'decrement')

    const after = rowById(id)!
    expect(qty(after)).toBe(before - 1)
    expect(subtotal(after)).toBe((before - 1) * unitPrice(after))
  })

  it('EV7: 수량이 0이 되면 그 줄은 언렌더된다', () => {
    render(<CartList />)
    const id = rowId(rows()[0])
    const startQty = qty(rowById(id)!)
    const startRows = rows().length

    for (let i = 0; i < startQty; i += 1) click(rowById(id)!, 'decrement')

    expect(rowById(id)).toBeNull()
    expect(rows().length).toBe(startRows - 1)
  })

  it('EV8: 수량이 0이 된 줄은 전체 합계에서 빠진다 — 합계가 남은 줄들의 소계 합과 같다', () => {
    render(<CartList />)
    const id = rowId(rows()[0])
    const startQty = qty(rowById(id)!)

    for (let i = 0; i < startQty; i += 1) click(rowById(id)!, 'decrement')

    const remaining = rows()
    expect(remaining.length).toBeGreaterThan(0)
    expect(total()).toBe(remaining.reduce((sum, r) => sum + subtotal(r), 0))
  })

  it('EV9: 전체 합계가 렌더되고 모든 줄 소계의 합과 같다 — 값과 표시 숫자 모두', () => {
    render(<CartList />)
    const expected = rows().reduce((sum, r) => sum + subtotal(r), 0)
    expect(total()).toBe(expected)
    expect(digits(screen.getByTestId('cart-total'))).toBe(String(expected))
  })

  it('EV10: 전체 합계는 목록 «아래»에 온다 — 목록 바깥이면서 문서 순서상 목록 뒤', () => {
    render(<CartList />)
    const list = screen.getByRole('list')
    const totalEl = screen.getByTestId('cart-total')
    expect(list.contains(totalEl)).toBe(false)
    expect(list.compareDocumentPosition(totalEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('EV11: 수량이 바뀌면 전체 합계가 다시 계산된다 — + 한 번에 그 줄 단가만큼 오른다', () => {
    render(<CartList />)
    const id = rowId(rows()[0])
    const before = total()
    const price = unitPrice(rowById(id)!)

    click(rowById(id)!, 'increment')

    expect(total()).toBe(before + price)
  })
})
