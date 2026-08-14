import { useEffect, useRef, useState } from 'react';
import './CartList.css';

type CartItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

/** 줄이 제거된 뒤 포커스를 보낼 곳. */
type FocusTarget = { kind: 'item'; id: string } | { kind: 'empty' } | null;

const INITIAL_ITEMS: CartItem[] = [
  { id: 'apple', name: '사과', unitPrice: 1200, quantity: 2 },
  { id: 'milk', name: '우유', unitPrice: 2500, quantity: 1 },
  { id: 'bread', name: '식빵', unitPrice: 3200, quantity: 3 },
];

/** 1200 → "1,200원" */
function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

function subtotalOf(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

export default function CartList() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);

  const decreaseButtons = useRef(new Map<string, HTMLButtonElement>());
  const emptyMessage = useRef<HTMLParagraphElement>(null);

  // 줄이 제거되면 포커스가 사라진 버튼에 남아 body로 이탈한다. 이웃 줄로 옮긴다.
  useEffect(() => {
    if (focusTarget === null) return;
    if (focusTarget.kind === 'empty') {
      emptyMessage.current?.focus();
    } else {
      decreaseButtons.current.get(focusTarget.id)?.focus();
    }
    setFocusTarget(null);
  }, [focusTarget]);

  function handleIncrease(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  function handleDecrease(id: string) {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;

    if (items[index].quantity > 1) {
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        ),
      );
      return;
    }

    // 수량이 0이 되는 줄은 숨기지 않고 목록에서 빼 언렌더한다.
    const remaining = items.filter((item) => item.id !== id);
    setItems(remaining);

    const neighbor: CartItem | undefined = items[index + 1] ?? items[index - 1];
    setFocusTarget(
      neighbor ? { kind: 'item', id: neighbor.id } : { kind: 'empty' },
    );
  }

  if (items.length === 0) {
    return (
      <section className="cart" aria-label="장바구니">
        <p className="cart-empty" ref={emptyMessage} tabIndex={-1}>
          담긴 항목이 없습니다
        </p>
      </section>
    );
  }

  const total = items.reduce((sum, item) => sum + subtotalOf(item), 0);

  return (
    <section className="cart" aria-label="장바구니">
      <ul className="cart-items">
        {items.map((item) => (
          <li key={item.id} className="cart-item">
            <span className="cart-item-name">{item.name}</span>
            <span className="cart-item-price">단가 {formatWon(item.unitPrice)}</span>
            <span className="cart-stepper">
              <button
                type="button"
                className="cart-step"
                aria-label={`${item.name} 수량 감소`}
                onClick={() => handleDecrease(item.id)}
                ref={(node) => {
                  if (node) decreaseButtons.current.set(item.id, node);
                  return () => {
                    decreaseButtons.current.delete(item.id);
                  };
                }}
              >
                <span aria-hidden="true">−</span>
              </button>
              <span className="cart-quantity">{item.quantity}개</span>
              <button
                type="button"
                className="cart-step"
                aria-label={`${item.name} 수량 증가`}
                onClick={() => handleIncrease(item.id)}
              >
                <span aria-hidden="true">+</span>
              </button>
            </span>
            <span className="cart-item-subtotal">
              소계 {formatWon(subtotalOf(item))}
            </span>
          </li>
        ))}
      </ul>
      <p className="cart-total">
        전체 합계 <strong>{formatWon(total)}</strong>
      </p>
    </section>
  );
}
