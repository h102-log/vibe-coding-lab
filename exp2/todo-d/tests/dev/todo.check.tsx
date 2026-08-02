/**
 * 자체 검증 테스트. SPEC.md 1·2번 문장 중 무엇을 지키는지 각 케이스 제목에 달았다.
 * 인수 테스트(tests/ac/**)와 별개이며 `npm run test:dev`로 돌린다.
 *
 * 특히 인수 테스트가 검사하지 않을 수도 있는 다음 문장을 이 파일이 지킨다.
 *   U-04  Enter 한 번이 항목 두 개를 만들지 않는다 (keydown 경로 + form submit 경로 공존)
 *   U-13  같은 제목의 항목도 서로 다른 식별자를 가져 개별 삭제된다
 *   U-32  todo-count는 현재 필터와 무관하게 전체 기준 미완료 개수를 센다
 *   U-34  목록은 언마운트 후 다시 마운트해도 남는다 / 저장값이 깨졌으면 빈 목록으로 시작한다
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";

const input = () => screen.getByTestId("todo-input") as HTMLInputElement;
const items = () => screen.queryAllByTestId("todo-item");
const titles = () =>
  screen.queryAllByTestId("todo-title").map((el) => el.textContent);
const toggles = () =>
  screen.queryAllByTestId("todo-toggle") as HTMLInputElement[];
const count = () => screen.getByTestId("todo-count").textContent;

const user = userEvent.setup();

const add = async (title: string) => {
  await user.type(input(), `${title}{enter}`);
};

const deleteAt = async (index: number) => {
  await user.click(within(items()[index]).getByTestId("todo-delete"));
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("초기 상태", () => {
  it("S-08/S-11/S-12/S-13/U-35: 항목 0개여도 입력·개수·필터 3종이 있고 개수는 0이다", () => {
    render(<App />);
    expect(input().value).toBe("");
    expect(items()).toHaveLength(0);
    expect(count()).toBe("0");
    expect(screen.getByTestId("filter-all")).toBeTruthy();
    expect(screen.getByTestId("filter-active")).toBeTruthy();
    expect(screen.getByTestId("filter-completed")).toBeTruthy();
  });

  it("U-20/U-29: 초기 필터는 전체이고 그 버튼만 aria-pressed=true다", () => {
    render(<App />);
    expect(screen.getByTestId("filter-all").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("filter-active").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("filter-completed").getAttribute("aria-pressed")).toBe("false");
  });
});

describe("추가", () => {
  it("U-05/U-07/U-09: 앞뒤 공백을 잘라 뒤에 붙이고 입력창을 비운다", async () => {
    render(<App />);
    await add("  a  ");
    await add("b");
    expect(titles()).toEqual(["a", "b"]);
    expect(input().value).toBe("");
  });

  it("U-06/U-08: 공백뿐인 입력은 항목을 만들지 않고, 그 뒤 정상 입력은 그대로 동작한다", async () => {
    render(<App />);
    await add("   ");
    expect(items()).toHaveLength(0);
    await add("a");
    expect(titles()).toEqual(["a"]);
  });

  it("U-04: user.type의 Enter 한 번은 항목을 하나만 만든다", async () => {
    render(<App />);
    await add("a");
    expect(items()).toHaveLength(1);
  });

  it("U-04: fireEvent.keyDown(Enter) 한 번도 항목을 하나만 만든다", () => {
    render(<App />);
    fireEvent.change(input(), { target: { value: "a" } });
    fireEvent.keyDown(input(), { key: "Enter", code: "Enter" });
    expect(titles()).toEqual(["a"]);
  });

  it("U-03: form submit 경로로도 추가된다", () => {
    render(<App />);
    fireEvent.change(input(), { target: { value: "a" } });
    fireEvent.submit(input().closest("form")!);
    expect(titles()).toEqual(["a"]);
  });

  it("U-10/U-12: 같은 제목도 별개 항목이 되고 초기 상태는 미완료다", async () => {
    render(<App />);
    await add("a");
    await add("a");
    expect(titles()).toEqual(["a", "a"]);
    expect(toggles().map((el) => el.checked)).toEqual([false, false]);
    expect(count()).toBe("2");
  });
});

describe("토글·삭제", () => {
  it("U-15/U-17/U-19/U-33: 클릭한 항목만 완료로 바뀌고 순서는 그대로다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await user.click(toggles()[0]);
    expect(toggles().map((el) => el.checked)).toEqual([true, false]);
    expect(titles()).toEqual(["a", "b"]);
    expect(count()).toBe("1");
    await user.click(toggles()[0]);
    expect(toggles()[0].checked).toBe(false);
    expect(count()).toBe("2");
  });

  it("U-13/U-18: 제목이 같아도 클릭한 항목 하나만 지워진다", async () => {
    render(<App />);
    await add("a");
    await add("a");
    await add("b");
    await deleteAt(0);
    expect(titles()).toEqual(["a", "b"]);
    expect(items()).toHaveLength(2);
  });

  it("U-16/U-33: 삭제 버튼은 새 항목을 만들지 않고 완료 항목 삭제는 개수를 바꾸지 않는다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await user.click(toggles()[0]);
    expect(count()).toBe("1");
    await deleteAt(0);
    expect(titles()).toEqual(["b"]);
    expect(count()).toBe("1");
  });
});

describe("필터", () => {
  it("U-22/U-23/U-24/U-28: 각 필터는 해당 항목만 DOM에 남긴다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await user.click(toggles()[0]);

    await user.click(screen.getByTestId("filter-active"));
    expect(titles()).toEqual(["b"]);

    await user.click(screen.getByTestId("filter-completed"));
    expect(titles()).toEqual(["a"]);
    expect(toggles()[0].checked).toBe(true);

    await user.click(screen.getByTestId("filter-all"));
    expect(titles()).toEqual(["a", "b"]);
  });

  it("U-25: 필터가 걸린 상태에서 토글하면 조건을 벗어난 항목은 사라진다", async () => {
    render(<App />);
    await add("a");
    await user.click(screen.getByTestId("filter-active"));
    expect(titles()).toEqual(["a"]);
    await user.click(toggles()[0]);
    expect(items()).toHaveLength(0);
    await user.click(screen.getByTestId("filter-completed"));
    expect(titles()).toEqual(["a"]);
  });

  it("U-26: 필터가 걸린 채로 추가해도 필터는 유지된다", async () => {
    render(<App />);
    await add("a");
    await user.click(toggles()[0]);
    await user.click(screen.getByTestId("filter-completed"));
    await add("b");
    expect(titles()).toEqual(["a"]);
    expect(screen.getByTestId("filter-completed").getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByTestId("filter-all"));
    expect(titles()).toEqual(["a", "b"]);
  });

  it("U-27: 필터 상태에서 지운 항목은 전체로 돌아가도 없다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await user.click(screen.getByTestId("filter-active"));
    await deleteAt(0);
    await user.click(screen.getByTestId("filter-all"));
    expect(titles()).toEqual(["b"]);
  });

  it("U-30/U-31/U-32: todo-count는 숫자만 담고 필터와 무관하게 전체 미완료 수를 센다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await add("c");
    await user.click(toggles()[0]);
    expect(count()).toMatch(/^\d+$/);
    expect(count()).toBe("2");
    await user.click(screen.getByTestId("filter-completed"));
    expect(titles()).toEqual(["a"]);
    expect(count()).toBe("2");
  });
});

describe("상태의 수명", () => {
  it("U-34: 언마운트 후 다시 렌더해도 목록과 완료 상태가 남는다", async () => {
    render(<App />);
    await add("A");
    await add("B");
    await user.click(toggles()[0]);

    cleanup();
    render(<App />);

    expect(titles()).toEqual(["A", "B"]);
    expect(toggles().map((el) => el.checked)).toEqual([true, false]);
    expect(count()).toBe("1");
  });

  it("U-13: 복원 후 추가한 항목의 식별자가 기존 항목과 겹치지 않는다", async () => {
    render(<App />);
    await add("A");
    cleanup();

    render(<App />);
    await add("B");
    await deleteAt(1);
    expect(titles()).toEqual(["A"]);
  });

  it("U-34: 저장값이 깨져 있으면 빈 목록으로 시작하고 계속 동작한다", async () => {
    localStorage.setItem("todos", "{ not json");
    render(<App />);
    expect(items()).toHaveLength(0);
    await add("a");
    expect(titles()).toEqual(["a"]);
  });

  it("U-34: 저장값이 배열이지만 항목 모양이 아니면 빈 목록으로 시작한다", () => {
    localStorage.setItem("todos", JSON.stringify([{ id: "x", title: 1 }]));
    render(<App />);
    expect(items()).toHaveLength(0);
  });
});
