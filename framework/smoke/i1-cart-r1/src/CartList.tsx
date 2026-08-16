/**
 * 담은 항목 목록. 요구와 근거는 SPEC.md 참조.
 * - 줄마다 이름 · 단가 · 수량 · 소계 (S2, S3)
 * - 아이콘만 있는 −/+ 스테퍼로 수량 ±1 (S4, S5, S6)
 * - 수량 0 = 더 이상 담긴 것이 아님 → 줄 제거 + 합계 제외 (S8, I1)
 */
import { useState } from 'react';
import { formatWon } from './formatWon';
import './CartList.css';

export type CartItem = {
  id: string;
  name: string;
  /** 단가. 정수 원 단위 (SPEC.md I8) */
  unitPrice: number;
  quantity: number;
};

type CartListProps = {
  /** 생략하면 하드코딩된 시작 데이터를 쓴다 (SPEC.md S10, I11) */
  items?: CartItem[];
};

/** 시작 데이터 (SPEC.md S10) */
const INITIAL_ITEMS: CartItem[] = [
  { id: 'apple', name: '유기농 사과 1kg', unitPrice: 12000, quantity: 2 },
  { id: 'beans', name: '핸드드립 원두 200g', unitPrice: 18500, quantity: 1 },
  { id: 'towel', name: '면 워시타월 3매', unitPrice: 6900, quantity: 3 },
];

export default function CartList({ items = INITIAL_ITEMS }: CartListProps) {
  const [lines, setLines] = useState<CartItem[]>(items);

  function changeQuantity(id: string, delta: number) {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.id !== id) return [line]; // 다른 줄은 그대로 (S7)
        const nextQuantity = line.quantity + delta;
        return nextQuantity <= 0 ? [] : [{ ...line, quantity: nextQuantity }]; // (S8)
      }),
    );
  }

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return (
    <section className="cart" aria-labelledby="cart-heading">
      <h2 id="cart-heading">장바구니</h2>

      {lines.length === 0 ? (
        <p className="cart-empty">담은 항목이 없습니다.</p>
      ) : (
        <ul className="cart-lines">
          {lines.map((line) => (
            <li key={line.id} className="cart-line">
              <span className="cart-name">{line.name}</span>
              <span className="cart-unit-price">
                <span className="cart-label">단가</span>
                {formatWon(line.unitPrice)}
              </span>
              <span className="cart-stepper" role="group" aria-label={`${line.name} 수량 조절`}>
                <button
                  type="button"
                  className="cart-step"
                  aria-label={`${line.name} 수량 줄이기`}
                  onClick={() => changeQuantity(line.id, -1)}
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span className="cart-quantity" aria-live="polite">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  className="cart-step"
                  aria-label={`${line.name} 수량 늘리기`}
                  onClick={() => changeQuantity(line.id, 1)}
                >
                  <span aria-hidden="true">+</span>
                </button>
              </span>
              <span className="cart-subtotal">
                <span className="cart-label">소계</span>
                {formatWon(line.unitPrice * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="cart-total">
        <span>합계</span>
        <strong>{formatWon(total)}</strong>
      </p>
    </section>
  );
}
