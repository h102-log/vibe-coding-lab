import { useState } from 'react'
import './CartList.css'

type CartItem = {
  id: string
  name: string
  unitPrice: number
  quantity: number
}

const INITIAL_ITEMS: CartItem[] = [
  { id: 'espresso-beans', name: '에스프레소 원두 200g', unitPrice: 18000, quantity: 2 },
  { id: 'oat-milk', name: '오트 밀크 1L', unitPrice: 4800, quantity: 1 },
  { id: 'paper-filter', name: '종이 필터 100매', unitPrice: 3500, quantity: 3 },
]

const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <line x1="4" y1="8" x2="12" y2="8" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <line x1="4" y1="8" x2="12" y2="8" />
      <line x1="8" y1="4" x2="8" y2="12" />
    </svg>
  )
}

export default function CartList() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS)

  const increment = (id: string) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)),
    )

  // 수량 0 = 더 이상 담긴 것이 아니다 — 0으로 남기지 않고 목록에서 뺀다.
  const decrement = (id: string) =>
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return [item]
        return item.quantity <= 1 ? [] : [{ ...item, quantity: item.quantity - 1 }]
      }),
    )

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <section className="cart">
      <ul className="cart-list">
        {items.map((item) => {
          const subtotal = item.quantity * item.unitPrice
          return (
            <li className="cart-row" key={item.id} data-testid="cart-row" data-item-id={item.id}>
              <span className="cart-name" data-testid="item-name">
                {item.name}
              </span>

              <span className="cart-unit-price" data-testid="unit-price" data-value={item.unitPrice}>
                {won(item.unitPrice)}
              </span>

              <span className="cart-stepper">
                <button
                  type="button"
                  className="cart-stepper-button"
                  data-testid="decrement"
                  aria-label={`${item.name} 수량 1 줄이기`}
                  onClick={() => decrement(item.id)}
                >
                  <MinusIcon />
                </button>

                <span className="cart-quantity" data-testid="quantity" data-value={item.quantity}>
                  {item.quantity}
                </span>

                <button
                  type="button"
                  className="cart-stepper-button"
                  data-testid="increment"
                  aria-label={`${item.name} 수량 1 늘리기`}
                  onClick={() => increment(item.id)}
                >
                  <PlusIcon />
                </button>
              </span>

              <span className="cart-subtotal" data-testid="subtotal" data-value={subtotal}>
                {won(subtotal)}
              </span>
            </li>
          )
        })}
      </ul>

      {items.length === 0 && <p className="cart-empty">담은 항목이 없습니다.</p>}

      <p className="cart-total">
        <span>전체 합계</span>
        <span className="cart-total-amount" data-testid="cart-total" data-value={total}>
          {won(total)}
        </span>
      </p>
    </section>
  )
}
