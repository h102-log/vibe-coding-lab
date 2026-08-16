/**
 * 금액 표기 (SPEC.md I8: "금액은 정수 원화이고, 천 단위 쉼표 + `원` 접미사로 표시한다.
 * 표시 포맷은 실행 환경의 로케일·ICU 설정에 의존하지 않는다").
 *
 * Intl에 기대지 않으므로 어느 머신·어느 로케일에서도 같은 문자열을 낸다.
 */
export function formatWon(amount: number): string {
  return `${amount.toString().replace(/\B(?=(\d{3})+$)/g, ',')}원`;
}
