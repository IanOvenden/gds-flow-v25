// @ts-nocheck
import type { Meta } from '@storybook/react';
import GdsTaskForceGdsTaskList from './index';
import { TaskItem } from './types';

const meta: Meta<typeof GdsTaskForceGdsTaskList> = {
  title: 'GDS Components/TaskList',
  component: GdsTaskForceGdsTaskList,
  excludeStories: /.*Data$/,
  parameters: {
    type: 'Form'
  }
};

export default meta;

/**
 * Creates mock task data for demonstration
 */
const createMockTasks = (count: number = 5): TaskItem[] => {
  const tasks: TaskItem[] = [
    {
      id: 'task-1',
      name: 'Company Directors',
      status: 'completed',
      href: '#task-1'
    },
    {
      id: 'task-2',
      name: 'Registered company details',
      status: 'incomplete',
      href: '#task-2'
    },
    {
      id: 'task-3',
      name: 'Financial history',
      status: 'incomplete',
      hint: "Include 5 years of the company's relevant financial information",
      href: '#task-3'
    },
    {
      id: 'task-4',
      name: 'Business plan',
      status: 'incomplete',
      href: '#task-4'
    },
    {
      id: 'task-5',
      name: 'References',
      status: 'not-started',
      href: '#task-5'
    }
  ];
  return tasks.slice(0, count);
};

/**
 * Creates a mock D_TaskList data page response
 */
const createMockDataPageResponse = (tasks: TaskItem[]) => ({
  pxResults: tasks.map(task => ({
    pyID: task.id,
    pyLabel: task.name,
    pyStatusWork: task.status,
    pyDescription: task.hint,
    pyURL: task.href
  }))
});

/**
 * Creates a mock PConnect object for Storybook with D_TaskList data page
 */
const createMockPConnect = (tasks: TaskItem[], instructions?: string) => {
  const dataPageResponse = createMockDataPageResponse(tasks);

  return {
    getDataObject: (dataPageName: string) => {
      if (dataPageName === 'D_TaskList') {
        return dataPageResponse;
      }
      return null;
    },
    getConfigProps: () => ({}),
    getInstructions: () => instructions || '',
    getLocalizedValue: (val: string) => val,
    getValue: (propName: string) => {
      if (propName === '.instructions') {
        return instructions || '';
      }
      return undefined;
    },
    getInheritedProps: () => ({}),
    getCurrentView: () => 'TaskList',
    getCurrentClassID: () => 'Work-TaskList',
    getContextName: () => 'app',
    getChildren: () => [],
    createComponent: () => null
  };
};

/**
 * Default task list with various statuses
 */
export const BaseGdsTaskForceGdsTaskList = () => {
  const props = {
    heading: 'Application tasks',
    // @ts-ignore - Mock PConnect for Storybook
    getPConnect: () => createMockPConnect(createMockTasks())
  };

  return <GdsTaskForceGdsTaskList {...props} />;
};

/**
 * Task list with instructions
 */
export const WithInstructions = () => {
  const props = {
    heading: 'Complete your application',
    instructions: '<p>Complete all sections before submitting your application. You can save and return to complete sections at any time.</p>',
    // @ts-ignore - Mock PConnect for Storybook
    getPConnect: () => createMockPConnect(createMockTasks(), '<p>Complete all sections before submitting your application.</p>')
  };

  return <GdsTaskForceGdsTaskList {...props} />;
};

/**
 * Task list with all tasks completed
 */
export const AllCompleted = () => {
  const props = {
    heading: 'Application complete',
    // @ts-ignore - Mock PConnect for Storybook
    getPConnect: () =>
      createMockPConnect([
        { id: 'task-1', name: 'Company Directors', status: 'completed', href: '#task-1' },
        { id: 'task-2', name: 'Registered company details', status: 'completed', href: '#task-2' },
        { id: 'task-3', name: 'Financial history', status: 'completed', href: '#task-3' }
      ])
  };

  return <GdsTaskForceGdsTaskList {...props} />;
};

/**
 * Task list with tasks that cannot be started
 */
export const WithBlockedTasks = () => {
  const props = {
    heading: 'Application tasks',
    // @ts-ignore - Mock PConnect for Storybook
    getPConnect: () =>
      createMockPConnect([
        { id: 'task-1', name: 'Company Directors', status: 'completed', href: '#task-1' },
        { id: 'task-2', name: 'Registered company details', status: 'incomplete', href: '#task-2' },
        { id: 'task-3', name: 'Financial history', status: 'cannot-start', hint: 'Complete company details first', href: '#task-3' },
        { id: 'task-4', name: 'Business plan', status: 'cannot-start', href: '#task-4' }
      ])
  };

  return <GdsTaskForceGdsTaskList {...props} />;
};

/**
 * Empty task list
 */
export const Empty = () => {
  const props = {
    heading: 'No tasks available',
    // @ts-ignore - Mock PConnect for Storybook
    getPConnect: () => createMockPConnect([])
  };

  return <GdsTaskForceGdsTaskList {...props} />;
};

/**
 * Task with incomplete status
 */
export const IncompleteTask = () => {
  const props = {
    heading: 'Application tasks',
    // @ts-ignore - Mock PConnect for Storybook
    getPConnect: () =>
      createMockPConnect([
        { id: 'task-1', name: 'Company Directors', status: 'completed', href: '#task-1' },
        {
          id: 'task-2',
          name: 'Registered company details',
          status: 'incomplete',
          hint: 'You have started this section but not completed it',
          href: '#task-2'
        },
        { id: 'task-3', name: 'Financial history', status: 'not-started', href: '#task-3' }
      ])
  };

  return <GdsTaskForceGdsTaskList {...props} />;
};

/**
 * Task list with extensive hint text
 */
export const WithDetailedHints = () => {
  const props = {
    heading: 'Application tasks',
    // @ts-ignore - Mock PConnect for Storybook
    getPConnect: () =>
      createMockPConnect([
        {
          id: 'task-1',
          name: 'Personal information',
          status: 'completed',
          hint: 'Provide your full legal name, date of birth, and National Insurance number',
          href: '#task-1'
        },
        {
          id: 'task-2',
          name: 'Financial information',
          status: 'incomplete',
          hint: 'Include your bank statements for the last 3 months and proof of income',
          href: '#task-2'
        },
        {
          id: 'task-3',
          name: 'Supporting documents',
          status: 'not-started',
          hint: 'Upload copies of your passport, utility bills, and any relevant certificates',
          href: '#task-3'
        }
      ])
  };

  return <GdsTaskForceGdsTaskList {...props} />;
};
