export type Filter = "all" | "active" | "completed";

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

/** 편집 중인 항목과 아직 확정되지 않은 초안. 편집 중이 아니면 null이다. (SPEC U-48, U-54) */
export type Editing = {
  id: number;
  draft: string;
};

export type TodoState = {
  todos: Todo[];
  filter: Filter;
  nextId: number;
  editing: Editing | null;
};
