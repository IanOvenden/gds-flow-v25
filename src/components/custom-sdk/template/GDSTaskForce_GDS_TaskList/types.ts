export interface TaskItem {
  id: string;
  name: string;
  status: 'completed' | 'incomplete' | 'not-started' | 'cannot-start';
  hint?: string;
  href?: string;
  action?: any; // Matched availableProcess from caseInfo
}

export interface TaskListProps {
  tasks: TaskItem[];
  heading?: string;
}
