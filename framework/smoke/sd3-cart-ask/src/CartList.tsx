import { useState } from 'react';
import './CartList.css';

type CartItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

const INITIAL_ITEMS: CartItem[] = [
  { id: 'americano', name: '아메리카노', unitPrice: 4500, quantity: 2 },
  { id: 'latte', name: '카페라떼', unitPrice: 5000, quantity: 1 },
  { id: 'scone', name: '버터 스콘', unitPrice: 3800, quantity: 3 },
];

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
});

export default function CartList() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);

  // 수량이 0이 된 줄은 담긴 항목이 아니므로 목록에서 뺀다.
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
      <h2>담은 항목</h2>

      {items.length === 0 ? (
        <p className="cart-empty">담은 항목이 없습니다.</p>
      ) : (
        <ul className="cart-list">
          {items.map((item) => (
            <li className="cart-row" key={item.id}>
              <span className="cart-name">{item.name}</span>
              <span className="cart-unit-price">{won.format(item.unitPrice)}</span>
              <span className="cart-stepper">
                <button
                  type="button"
                  className="cart-step"
                  aria-label={`${item.name} 수량 줄이기`}
                  onClick={() => changeQuantity(item.id, -1)}
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span className="cart-quantity">{item.quantity}개</span>
                <button
                  type="button"
                  className="cart-step"
                  aria-label={`${item.name} 수량 늘리기`}
                  onClick={() => changeQuantity(item.id, 1)}
                >
                  <span aria-hidden="true">+</span>
                </button>
              </span>
              <span className="cart-subtotal">
                {won.format(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="cart-total">
        <span>전체 합계</span>
        <strong>{won.format(total)}</strong>
      </p>
    </section>
  );
}
