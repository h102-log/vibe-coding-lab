export type Filter = "all" | "active" | "completed";

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

export type TodoState = {
  todos: Todo[];
  filter: Filter;
  nextId: number;
};
