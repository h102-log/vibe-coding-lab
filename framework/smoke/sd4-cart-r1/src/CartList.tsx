import { useState } from 'react';
import './CartList.css';

export type CartItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

const INITIAL_ITEMS: CartItem[] = [
  { id: 'americano', name: '아메리카노 원두 1kg', unitPrice: 18500, quantity: 2 },
  { id: 'tumbler', name: '보온 텀블러 500ml', unitPrice: 24000, quantity: 1 },
  { id: 'filter', name: '드립 필터 100매', unitPrice: 4800, quantity: 3 },
];

const currency = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
});

function formatPrice(value: number) {
  return currency.format(value);
}

export default function CartList() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);

  // 수량이 0이 되면 더 이상 담긴 항목이 아니므로 목록에서 빠진다.
  function changeQuantity(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <section className="cart">
      <h2 className="cart-title">장바구니</h2>

      {items.length === 0 ? (
        <p className="cart-empty">담은 항목이 없습니다.</p>
      ) : (
        <ul className="cart-items">
          {items.map((item) => (
            <li key={item.id} className="cart-item">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-unit-price">
                {formatPrice(item.unitPrice)}
              </span>

              <span className="cart-stepper">
                <button
                  type="button"
                  className="cart-stepper-button"
                  aria-label={`${item.name} 수량 줄이기`}
                  onClick={() => changeQuantity(item.id, -1)}
                >
                  −
                </button>
                <span className="cart-item-quantity" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  className="cart-stepper-button"
                  aria-label={`${item.name} 수량 늘리기`}
                  onClick={() => changeQuantity(item.id, 1)}
                >
                  +
                </button>
              </span>

              <span className="cart-item-subtotal">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="cart-total">
        <span>전체 합계</span>
        <strong>{formatPrice(total)}</strong>
      </p>
    </section>
  );
}
