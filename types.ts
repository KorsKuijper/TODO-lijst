export enum Priority {
  LOW = 'Laag',
  MEDIUM = 'Gemiddeld',
  HIGH = 'Hoog'
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Category {
  id: string;
  name: string;
  color: string; // Hex code or Tailwind class fragment
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus; // Replaces isCompleted
  categoryId: string; // Link to Category ID
  priority: Priority;
  listId: string;
  createdAt: number;
  subtasks: SubTask[];
}

export interface TodoList {
  id: string;
  name: string;
  icon?: string;
  isDefault?: boolean;
}

export interface AIParseResult {
  tasks: {
    title: string;
    categoryName: string; // AI suggests the name, we map to ID
    priority: Priority;
  }[];
  suggestedListName: string;
}

export interface AppData {
  lists: TodoList[];
  categories: Category[];
  tasks: Task[];
  updatedAt: number;
}

// Icon names map for dynamic rendering
export type IconName = 'List' | 'Sun' | 'Star' | 'Briefcase' | 'ShoppingBag' | 'Home' | 'Zap';
