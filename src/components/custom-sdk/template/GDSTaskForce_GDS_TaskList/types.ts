export interface TaskItem {
  id: string;
  name: string;
  status: 'completed' | 'incomplete' | 'not-started' | 'cannot-start';
  hint?: string;
  href?: string;
}

export interface TaskListProps {
  tasks: TaskItem[];
  heading?: string;
}
