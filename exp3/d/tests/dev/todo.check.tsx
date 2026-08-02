/**
 * 자체 검증 테스트. SPEC.md 1·2번 문장 중 무엇을 지키는지 각 케이스 제목에 달았다.
 * 인수 테스트(tests/ac/**)와 별개이며 `npm run test:dev`로 돌린다.
 *
 * 특히 인수 테스트가 검사하지 않을 수도 있는 다음 문장을 이 파일이 지킨다.
 *   U-04  Enter 한 번이 항목 두 개를 만들지 않는다 (keydown 경로 + form submit 경로 공존)
 *   U-13  같은 제목의 항목도 서로 다른 식별자를 가져 개별 삭제된다
 *   U-32  todo-count는 현재 필터와 무관하게 전체 기준 미완료 개수를 센다
 *   U-34  목록은 언마운트 후 다시 마운트해도 남는다 / 저장값이 깨졌으면 빈 목록으로 시작한다
 *
 * 제목 인라인 편집(S-20~S-22, U-47~U-69)은 변경 요구 시점의 인수 테스트가 전혀 건드리지 않는다(8케이스 그대로).
 * 그래서 그 동작은 아래 "제목 편집" 블록이 유일한 검증 수단이다 — 특히 추론으로 정한 갈림길
 * U-58(빈 확정은 원래 제목 유지), U-61(blur 확정과 멱등성), U-49(제목 자리 대체), U-68(필터 전환·삭제 시 편집 종료).
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

const editBoxes = () => screen.queryAllByTestId("todo-edit");
const editBox = () => screen.getByTestId("todo-edit") as HTMLInputElement;

const startEditAt = async (index: number) => {
  await user.dblClick(within(items()[index]).getByTestId("todo-title"));
};

const retype = async (text: string) => {
  await user.clear(editBox());
  if (text !== "") {
    await user.type(editBox(), text);
  }
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

describe("제목 편집 — 여는 지점", () => {
  it("S-20/U-47/U-48/U-50: 더블클릭하면 todo-edit이 하나 열리고 현재 제목이 담긴 채 포커스를 받는다", async () => {
    render(<App />);
    await add("a");
    expect(editBoxes()).toHaveLength(0);

    await startEditAt(0);
    expect(editBoxes()).toHaveLength(1);
    expect(editBox().value).toBe("a");
    expect(document.activeElement).toBe(editBox());
  });

  it("U-49: 편집 중인 항목의 제목 자리를 입력창이 대체하고 다른 항목의 제목은 그대로다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);

    expect(titles()).toEqual(["b"]); // 편집 중인 항목의 todo-title은 DOM에 없다
    expect(within(items()[0]).queryByTestId("todo-title")).toBeNull();
    expect(within(items()[0]).getByTestId("todo-edit")).toBeTruthy();
  });

  it("U-51: 단일 클릭·토글 더블클릭·항목 여백 더블클릭은 편집을 열지 않는다", async () => {
    render(<App />);
    await add("a");

    await user.click(screen.getByTestId("todo-title"));
    expect(editBoxes()).toHaveLength(0);

    await user.dblClick(toggles()[0]);
    expect(editBoxes()).toHaveLength(0);

    await user.dblClick(items()[0]);
    expect(editBoxes()).toHaveLength(0);
  });

  it("U-52/U-55: 완료된 항목도 편집할 수 있고 편집 중에도 토글·삭제는 그대로 있다", async () => {
    render(<App />);
    await add("a");
    await user.click(toggles()[0]);
    await startEditAt(0);

    expect(editBox().value).toBe("a");
    expect(within(items()[0]).getByTestId("todo-toggle")).toBeTruthy();
    expect(within(items()[0]).getByTestId("todo-delete")).toBeTruthy();
    expect(items()).toHaveLength(1);
  });

  it("U-53/U-61: 편집 중 다른 항목을 더블클릭하면 편집이 옮겨가고 입력창은 여전히 하나다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);
    await retype("a2");

    await startEditAt(1);
    expect(editBoxes()).toHaveLength(1);
    expect(editBox().value).toBe("b");
    expect(titles()).toEqual(["a2"]); // 첫 항목은 포커스를 잃으며 확정됐다 (U-61)
  });
});

describe("제목 편집 — 고치는 동안", () => {
  it("U-54: 확정 전 타이핑은 저장된 제목·개수·항목 수를 바꾸지 않는다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);
    await retype("바뀐 제목");

    expect(editBox().value).toBe("바뀐 제목");
    expect(titles()).toEqual(["b"]);
    expect(count()).toBe("2");
    expect(items()).toHaveLength(2);
  });

  it("U-56: 편집 중에도 추가·토글·삭제가 계속 동작한다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);

    await add("c"); // 입력창으로 포커스가 옮겨가며 편집은 확정된다 (U-61)
    expect(titles()).toEqual(["a", "b", "c"]);

    await user.click(toggles()[1]);
    expect(count()).toBe("2");
    await deleteAt(2);
    expect(titles()).toEqual(["a", "b"]);
  });
});

describe("제목 편집 — 끝내는 지점", () => {
  it("S-21/U-59/U-62/U-64: Enter는 제목을 바꾸고 입력창을 닫는다 — 항목이 늘지 않고 완료 여부·순서는 그대로다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await user.click(toggles()[0]);
    await startEditAt(0);
    await retype("a2");
    await user.keyboard("{Enter}"); // 포커스가 입력창에 있다는 전제 (U-50)

    expect(titles()).toEqual(["a2", "b"]);
    expect(editBoxes()).toHaveLength(0);
    expect(items()).toHaveLength(2);
    expect(toggles().map((el) => el.checked)).toEqual([true, false]);
    expect(count()).toBe("1");
  });

  it("S-22/U-59/U-60: Escape는 초안을 버리고, 다시 열면 원래 제목이 들어 있다", async () => {
    render(<App />);
    await add("a");
    await startEditAt(0);
    await retype("버릴 초안");
    await user.keyboard("{Escape}");

    expect(titles()).toEqual(["a"]);
    expect(editBoxes()).toHaveLength(0);

    await startEditAt(0);
    expect(editBox().value).toBe("a");
  });

  it("U-61: Escape로 취소한 뒤 다른 곳을 클릭해도 버린 초안이 되살아나지 않는다 (확정·취소는 멱등)", async () => {
    render(<App />);
    await add("a");
    await startEditAt(0);
    await retype("버릴 초안");
    await user.keyboard("{Escape}");
    await user.click(input());

    expect(titles()).toEqual(["a"]);
    expect(editBoxes()).toHaveLength(0);
  });

  it("U-57: 확정되는 제목은 앞뒤 공백을 자른 값이다", async () => {
    render(<App />);
    await add("a");
    await startEditAt(0);
    await retype("   a2   ");
    await user.keyboard("{Enter}");

    expect(titles()).toEqual(["a2"]);
  });

  it("U-58: 빈 제목 확정은 원래 제목을 유지하고 항목을 지우지 않는다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);
    await retype("   ");
    await user.keyboard("{Enter}");

    expect(titles()).toEqual(["a", "b"]);
    expect(items()).toHaveLength(2);
    expect(editBoxes()).toHaveLength(0);
  });

  it("U-61: 포커스를 잃으면 Enter와 같이 확정한다", async () => {
    render(<App />);
    await add("a");
    await startEditAt(0);
    await retype("a2");
    await user.click(input());

    expect(titles()).toEqual(["a2"]);
    expect(editBoxes()).toHaveLength(0);
  });

  it("U-63: 한글 조합 중인 Enter는 확정이 아니다", async () => {
    render(<App />);
    await add("a");
    await startEditAt(0);
    await retype("a2");

    fireEvent.keyDown(editBox(), { key: "Enter", isComposing: true });
    expect(editBoxes()).toHaveLength(1);
    expect(titles()).toEqual([]);

    fireEvent.keyDown(editBox(), { key: "Enter" });
    expect(titles()).toEqual(["a2"]);
  });

  it("U-64/U-65: 다른 항목과 같은 제목으로 바꿔도 두 항목은 계속 구분된다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(1);
    await retype("a");
    await user.keyboard("{Enter}");
    expect(titles()).toEqual(["a", "a"]);

    await deleteAt(1);
    expect(titles()).toEqual(["a"]);
    expect(items()).toHaveLength(1);
  });
});

describe("제목 편집 — 끝난 뒤", () => {
  it("U-66: 편집한 제목은 재마운트 후에도 남는다", async () => {
    render(<App />);
    await add("a");
    await startEditAt(0);
    await retype("a2");
    await user.keyboard("{Enter}");

    cleanup();
    render(<App />);
    expect(titles()).toEqual(["a2"]);
  });

  it("U-67: 편집 상태는 저장되지 않는다 — 재마운트하면 편집 중이 아니고 초안도 반영되지 않는다", async () => {
    render(<App />);
    await add("a");
    await startEditAt(0);
    await retype("반영되면 안 되는 초안");

    cleanup();
    render(<App />);
    expect(editBoxes()).toHaveLength(0);
    expect(titles()).toEqual(["a"]);
  });

  it("U-61/U-68: 필터 버튼을 클릭하면 blur로 먼저 확정된 뒤 편집이 끝난다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);
    await retype("a2");
    await user.click(screen.getByTestId("filter-active"));

    expect(editBoxes()).toHaveLength(0);
    expect(titles()).toEqual(["a2", "b"]);
    expect(screen.getByTestId("filter-active").getAttribute("aria-pressed")).toBe("true");
  });

  it("U-68: 포커스 이동 없이 필터만 바뀌어도 편집이 열린 채 남지 않는다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);
    await retype("초안");

    // blur를 일으키지 않는 클릭 — setFilter가 편집 상태를 비우는 경로만 검사한다
    fireEvent.click(screen.getByTestId("filter-active"));

    expect(editBoxes()).toHaveLength(0);
    expect(titles()).toEqual(["a", "b"]);
  });

  it("U-68: 편집 중이던 항목을 지우면 편집도 끝난다", async () => {
    render(<App />);
    await add("a");
    await add("b");
    await startEditAt(0);
    await deleteAt(0);

    expect(editBoxes()).toHaveLength(0);
    expect(titles()).toEqual(["b"]);
    expect(items()).toHaveLength(1);
  });
});
