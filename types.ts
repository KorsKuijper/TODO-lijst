export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  listId: string;
  categoryId: string;
  title: string;
  description?: string;
  priority: Priority;
  label?: string; // Used for Client/Context
  deadline?: string; // ISO Date string
  isCompleted: boolean;
  status: TaskStatus;
  subtasks: Subtask[];
  completedAt?: string;
  createdAt: number;
}

export interface List {
  id: string;
  title: string;
  color: string;
  icon_name: string;
  isDefault?: boolean;
}

export type TodoList = List;

export interface AppData {
  lists: List[];
  tasks: Task[];
  categories: Category[];
  updatedAt: number;
}

export interface AIParseResult {
  tasks: {
    title: string;
    label: string;
    priority: Priority;
    deadline?: string;
  }[];
  suggestedListName: string;
}

// Icon names map for dynamic rendering
export type IconName = 'List' | 'Mountain' | 'Map' | 'Wrench' | 'Zap' | 'Flag';