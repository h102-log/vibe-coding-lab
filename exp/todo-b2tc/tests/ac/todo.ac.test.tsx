// 동결 인수 테스트 (frozen). 실험자가 구현 전에 작성했고 채점 시 원본으로 복원된다.
// 수정 금지. 각 테스트 제목의 앞 5글자(AC-0N)가 채점 ID다 — 바꾸면 그 항목은 failed로 집계된다.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";

const t = (id: string) => screen.getByTestId(id);
const items = () => screen.queryAllByTestId("todo-item");
const titles = () =>
  items().map((el) => within(el).getByTestId("todo-title").textContent?.trim());
// todo-count의 텍스트에서 숫자만 뽑는다. 문구는 자유지만 숫자는 정확히 하나여야 한다.
const nums = () => (t("todo-count").textContent?.match(/\d+/g) ?? []).map(Number);
const toggleOf = (i: number) =>
  within(items()[i]).getByTestId("todo-toggle") as HTMLInputElement;

function setup() {
  const user = userEvent.setup();
  render(<App />);
  return user;
}

async function add(user: ReturnType<typeof userEvent.setup>, title: string) {
  const input = t("todo-input");
  await user.click(input);
  if (title.length > 0) await user.type(input, title);
  await user.keyboard("{Enter}");
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Todo AC (frozen)", () => {
  it("AC-01", async () => {
    const user = setup();
    expect(items()).toHaveLength(0);
    await add(user, "우유 사기");
    expect(items()).toHaveLength(1);
    expect(titles()).toEqual(["우유 사기"]);
    expect((t("todo-input") as HTMLInputElement).value).toBe("");
  });

  it("AC-02", async () => {
    const user = setup();
    await add(user, "할일A");
    expect(items()).toHaveLength(1);
    await add(user, "   ");
    expect(items()).toHaveLength(1);
    await add(user, "");
    expect(items()).toHaveLength(1);
  });

  it("AC-03", async () => {
    const user = setup();
    await add(user, "할일A");
    expect(toggleOf(0).type).toBe("checkbox");
    expect(toggleOf(0).checked).toBe(false);
    expect(nums()).toEqual([1]);
    await user.click(toggleOf(0));
    expect(toggleOf(0).checked).toBe(true);
    // 교차 확인: 앱이 done 상태를 실제로 들고 있어야 한다.
    // uncontrolled 체크박스(jsdom이 알아서 뒤집는)만 놓으면 여기서 죽는다.
    expect(nums()).toEqual([0]);
    await user.click(toggleOf(0));
    expect(toggleOf(0).checked).toBe(false);
    expect(nums()).toEqual([1]);
  });

  it("AC-04", async () => {
    const user = setup();
    for (const s of ["A", "B", "C"]) await add(user, s);
    expect(titles()).toEqual(["A", "B", "C"]);
    await user.click(within(items()[1]).getByTestId("todo-delete"));
    expect(titles()).toEqual(["A", "C"]);
  });

  it("AC-05", async () => {
    const user = setup();
    for (const s of ["A", "B", "C"]) await add(user, s);
    expect(nums()).toEqual([3]);
    await user.click(toggleOf(0));
    expect(nums()).toEqual([2]);
    await user.click(within(items()[1]).getByTestId("todo-delete"));
    expect(nums()).toEqual([1]);
  });

  it("AC-06", async () => {
    const user = setup();
    for (const s of ["A", "B", "C"]) await add(user, s);
    await user.click(toggleOf(0));
    await user.click(t("filter-active"));
    expect(titles()).toEqual(["B", "C"]);
    await user.click(t("filter-completed"));
    expect(titles()).toEqual(["A"]);
    await user.click(t("filter-all"));
    expect(titles()).toEqual(["A", "B", "C"]);
  });

  it("AC-07", async () => {
    const user = setup();
    await add(user, "A");
    await add(user, "B");
    await user.click(toggleOf(0));
    cleanup();
    render(<App />);
    expect(titles()).toEqual(["A", "B"]);
    expect(toggleOf(0).checked).toBe(true);
    expect(toggleOf(1).checked).toBe(false);
    // 읽기 경로 증명: 저장소를 비웠는데도 항목이 남으면 상태를 다른 곳에 들고 있는 것이다.
    cleanup();
    localStorage.clear();
    render(<App />);
    expect(items()).toHaveLength(0);
  });

  it("AC-08", async () => {
    const user = setup();
    await add(user, "할일A");
    const row = items()[0];
    // getAllByRole + toContain — 이름 있는 요소가 여럿이어도 통과한다.
    // (getByRole은 "그 role의 요소가 화면에 정확히 하나"라는, 계약에 없는 제약을 건다.)
    expect(screen.getAllByRole("textbox", { name: /\S/ })).toContain(t("todo-input"));
    expect(within(row).getAllByRole("checkbox", { name: /\S/ })).toContain(
      within(row).getByTestId("todo-toggle"),
    );
    expect(within(row).getAllByRole("button", { name: /\S/ })).toContain(
      within(row).getByTestId("todo-delete"),
    );
  });
});
