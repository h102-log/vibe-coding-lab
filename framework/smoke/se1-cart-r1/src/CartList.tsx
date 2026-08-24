import { useState } from 'react'

import './CartList.css'

export type CartItem = {
  id: string
  name: string
  unitPrice: number
  quantity: number
}

// 시작 데이터 — 컴포넌트 안에 하드코딩한다 (SPEC S8·I12)
const INITIAL_ITEMS: CartItem[] = [
  { id: 'espresso-beans', name: '에스프레소 원두 200g', unitPrice: 12000, quantity: 2 },
  { id: 'dripper', name: '드리퍼', unitPrice: 18500, quantity: 1 },
  { id: 'paper-filter', name: '종이 필터 100매', unitPrice: 4500, quantity: 3 },
]

// 정수 원 + 천 단위 쉼표 (SPEC I6). Intl 로케일 데이터에 기대지 않는다 — 실행 환경과 무관하게 같은 문자열이다.
function won(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="12" height="12">
      <path d="M3 8h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function CartList() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS)

  // 수량이 0이 된 줄은 더 이상 담긴 것이 아니다 — 목록에서 빠지고 합계에도 들어가지 않는다 (SPEC S11·S12)
  function changeQuantity(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  return (
    <section className="cart">
      <h2 className="cart__title">장바구니</h2>

      {items.length === 0 ? (
        <p className="cart__empty">담은 항목이 없습니다</p>
      ) : (
        <ul className="cart__list">
          {items.map((item) => (
            <li className="cart__row" key={item.id}>
              <span className="cart__name">{item.name}</span>
              <span className="cart__unit-price" data-testid="unit-price">
                {won(item.unitPrice)}
              </span>

              <div className="stepper">
                <button
                  aria-label={`${item.name} 수량 감소`}
                  className="stepper__button"
                  onClick={() => changeQuantity(item.id, -1)}
                  type="button"
                >
                  <MinusIcon />
                </button>
                <span className="stepper__quantity" data-testid="qty">
                  {item.quantity}
                </span>
                <button
                  aria-label={`${item.name} 수량 증가`}
                  className="stepper__button"
                  onClick={() => changeQuantity(item.id, 1)}
                  type="button"
                >
                  <PlusIcon />
                </button>
              </div>

              <span className="cart__subtotal" data-testid="subtotal">
                {won(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="cart__total">
        <span>합계</span>
        <span className="cart__total-amount" data-testid="cart-total">
          {won(total)}
        </span>
      </p>
    </section>
  )
}
