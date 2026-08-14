import { useState } from 'react'
import './CartList.css'

/** 장바구니의 한 줄. 단가·수량은 0 이상의 정수(원). */
type CartItem = {
  id: number
  name: string
  unitPrice: number
  quantity: number
}

const INITIAL_ITEMS: CartItem[] = [
  { id: 1, name: '에티오피아 원두 500g', unitPrice: 18000, quantity: 2 },
  { id: 2, name: '유리 드리퍼', unitPrice: 24000, quantity: 1 },
  { id: 3, name: '종이 필터 100매', unitPrice: 6000, quantity: 3 },
]

const krw = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

export default function CartList() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS)

  // 수량이 0 이하로 내려간 줄은 더 이상 담긴 것이 아니므로 목록에서 빠진다.
  const changeQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return [item]
        const quantity = item.quantity + delta
        return quantity <= 0 ? [] : [{ ...item, quantity }]
      }),
    )
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  return (
    <section className="cart" aria-labelledby="cart-heading">
      <h2 id="cart-heading">담은 항목</h2>

      {items.length === 0 ? (
        <p className="cart-empty">담은 항목이 없습니다.</p>
      ) : (
        <ul className="cart-items">
          {items.map((item) => (
            <li className="cart-item" key={item.id}>
              <span className="cart-name">{item.name}</span>
              <span className="cart-unit-price">
                <span className="sr-only">단가 </span>
                {krw.format(item.unitPrice)}
              </span>
              <span className="cart-stepper">
                <button
                  type="button"
                  className="stepper-button"
                  aria-label={`${item.name} 수량 줄이기`}
                  onClick={() => changeQuantity(item.id, -1)}
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span className="cart-quantity">
                  <span className="sr-only">수량 </span>
                  {item.quantity}개
                </span>
                <button
                  type="button"
                  className="stepper-button"
                  aria-label={`${item.name} 수량 늘리기`}
                  onClick={() => changeQuantity(item.id, 1)}
                >
                  <span aria-hidden="true">+</span>
                </button>
              </span>
              <span className="cart-subtotal">
                <span className="sr-only">소계 </span>
                {krw.format(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="cart-total">
        <span>전체 합계</span>
        <strong>{krw.format(total)}</strong>
      </p>
    </section>
  )
}
