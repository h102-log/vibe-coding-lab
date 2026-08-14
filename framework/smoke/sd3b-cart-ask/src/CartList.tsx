import { useState } from 'react';
import './CartList.css';

type CartItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

const INITIAL_ITEMS: CartItem[] = [
  { id: 'keyboard', name: '기계식 키보드', unitPrice: 89000, quantity: 1 },
  { id: 'mousepad', name: '장패드', unitPrice: 12000, quantity: 2 },
  { id: 'cable', name: 'USB-C 케이블', unitPrice: 7500, quantity: 1 },
];

const numberFormat = new Intl.NumberFormat('ko-KR');

function formatAmount(amount: number) {
  return numberFormat.format(amount);
}

export default function CartList() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);

  function changeQuantity(id: string, delta: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      ),
    );
  }

  const inCart = items.filter((item) => item.quantity > 0);
  const total = inCart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <section className="cart">
      <h2>장바구니</h2>

      <ul className="cart-list">
        {items.map((item) => {
          const subtotal = item.unitPrice * item.quantity;
          const dropped = item.quantity === 0;

          return (
            <li
              key={item.id}
              className={dropped ? 'cart-row cart-row--dropped' : 'cart-row'}
            >
              <span className="cart-name">
                {item.name}
                {dropped && <span className="cart-dropped-tag">담기지 않음</span>}
              </span>
              <span className="cart-unit-price">{formatAmount(item.unitPrice)}</span>

              <span className="cart-stepper">
                <button
                  type="button"
                  className="cart-step"
                  aria-label={`${item.name} 수량 줄이기`}
                  disabled={item.quantity === 0}
                  onClick={() => changeQuantity(item.id, -1)}
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span className="cart-quantity">{item.quantity}</span>
                <button
                  type="button"
                  className="cart-step"
                  aria-label={`${item.name} 수량 늘리기`}
                  onClick={() => changeQuantity(item.id, 1)}
                >
                  <span aria-hidden="true">+</span>
                </button>
              </span>

              <span className="cart-subtotal">{formatAmount(subtotal)}</span>
            </li>
          );
        })}
      </ul>

      {inCart.length === 0 && (
        <p className="cart-empty">담긴 항목이 없습니다.</p>
      )}

      <p className="cart-total">
        총 <strong>{formatAmount(total)}</strong>원
      </p>
    </section>
  );
}
