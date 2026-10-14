export interface TaskItem {
  id: string;
  name: string;
  status: 'completed' | 'incomplete' | 'not-started' | 'cannot-start' | 'problem';
  statusLabel?: string; // Exact status value from the data page, rendered as-is
  hint?: string;
  href?: string;
  action?: any; // Matched availableProcess from caseInfo
}

export interface TaskListProps {
  tasks: TaskItem[];
  heading?: string;
}
