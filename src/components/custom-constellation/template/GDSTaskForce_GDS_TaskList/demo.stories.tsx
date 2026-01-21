// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Text, Card, CardContent, CardHeader } from '@pega/cosmos-react-core';
import { WorkTheme } from '@pega/cosmos-react-core';
import GdsTaskForceGdsTaskList from './index';
import React from 'react';
import { ThemeProvider } from 'styled-components';

const meta = {
  title: 'GDS Components/TaskList (Constellation Preview)',
  decorators: [
    Story => (
      <ThemeProvider theme={WorkTheme as any}>
        <Story />
      </ThemeProvider>
    )
  ],
  argTypes: {
    getPConnect: {
      table: {
        disable: true
      }
    },
    heading: {
      control: 'text',
      description: 'Optional heading text displayed above the task list'
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to show the field group label'
    },
    label: {
      control: 'text',
      description: 'Field group label (shown when showLabel is true)'
    },
    nCols: {
      control: 'number',
      description: 'Number of columns for Grid layout',
      defaultValue: 1
    },
    caseType: {
      control: 'select',
      options: ['', 'Auth'],
      description: 'Case type affects button text (Auth shows "Save And Continue")'
    }
  },
  component: GdsTaskForceGdsTaskList,
  parameters: {
    docs: {
      description: {
        component:
          'Preview version of the GDS Task List component as shown in Pega App Studio. This demonstrates how the component will appear when configuring it in the authoring environment. The component fetches task data from the D_TaskList data page and displays them using Pega Cosmos components (SummaryList, Button, Grid).'
      }
    }
  }
} satisfies Meta<typeof GdsTaskForceGdsTaskList>;

export default meta;

type Story = StoryObj<typeof GdsTaskForceGdsTaskList>;

/**
 * Creates a mock D_TaskList data page response
 */
const createMockDataPageResponse = (tasks: Array<{ name: string; status: string; hint?: string }>) => ({
  pxResults: tasks.map((task, index) => ({
    pyID: `task-${index + 1}`,
    TaskTitle: task.name,
    TaskName: task.name,
    pyLabel: task.name,
    Status: task.status,
    pyStatusWork: task.status,
    Hint: task.hint,
    pyDescription: task.hint
  }))
});

/**
 * Creates a mock PConnect object for Storybook with D_TaskList data page
 */
const createMockPConnect = (tasks: Array<{ name: string; status: string; hint?: string }>, label: string = 'Task List') => ({
  getInheritedProps: () => ({
    label
  }),
  getLocalizedValue: (val: string) => val,
  getDataObject: (dataPageName: string) => {
    if (dataPageName === 'D_TaskList') {
      return createMockDataPageResponse(tasks);
    }
    return null;
  },
  getContextName: () => 'app',
  getValue: () => undefined,
  getChildren: () => [],
  getConfigProps: () => ({})
});

/**
 * Default task list showing various task statuses with SummaryList
 */
export const Default: Story = {
  render: args => {
    const tasks = [
      { name: 'Company Directors', status: 'completed' },
      { name: 'Registered company details', status: 'incomplete' },
      { name: 'Financial history', status: 'incomplete', hint: 'Include 5 years of relevant financial information' },
      { name: 'Business plan', status: 'not-started' },
      { name: 'References', status: 'not-started' }
    ];

    const props = {
      heading: args.heading,
      showLabel: args.showLabel,
      label: args.label,
      nCols: args.nCols || 1,
      caseType: args.caseType || '',
      dataPage: 'D_TaskList',
      getPConnect: () => createMockPConnect(tasks, args.label),
      children: []
    };

    return (
      <Card>
        <CardHeader>
          <Text variant='h2'>Task List - Constellation Preview</Text>
          <Text variant='secondary'>Shows task completion with SummaryList component</Text>
        </CardHeader>
        <CardContent>
          <GdsTaskForceGdsTaskList {...props} />
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'Application tasks',
    showLabel: false,
    label: 'Task List',
    nCols: 1,
    caseType: ''
  }
};

/**
 * Task list with all tasks completed - shows Continue button
 */
export const AllCompleted: Story = {
  render: args => {
    const tasks = [
      { name: 'Company Directors', status: 'completed' },
      { name: 'Registered company details', status: 'completed' },
      { name: 'Financial history', status: 'completed', hint: 'Include 5 years of relevant financial information' },
      { name: 'Business plan', status: 'completed' },
      { name: 'References', status: 'completed' }
    ];

    const props = {
      heading: args.heading,
      showLabel: args.showLabel,
      label: args.label,
      nCols: args.nCols || 1,
      caseType: args.caseType || '',
      dataPage: 'D_TaskList',
      getPConnect: () => createMockPConnect(tasks, args.label),
      children: []
    };

    return (
      <Card>
        <CardHeader>
          <Text variant='h2'>All Tasks Completed</Text>
          <Text variant='secondary'>Continue button appears when all sections are complete</Text>
        </CardHeader>
        <CardContent>
          <GdsTaskForceGdsTaskList {...props} />
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'Application complete',
    showLabel: false,
    label: 'Completed Tasks',
    nCols: 1,
    caseType: ''
  }
};

/**
 * Auth case type - shows "Save And Continue" button when complete
 */
export const AllCompletedAuth: Story = {
  render: args => {
    const tasks = [
      { name: 'Personal details', status: 'completed' },
      { name: 'Contact information', status: 'completed' },
      { name: 'Security questions', status: 'completed' }
    ];

    const props = {
      heading: args.heading,
      showLabel: args.showLabel,
      label: args.label,
      nCols: args.nCols || 1,
      caseType: 'Auth',
      dataPage: 'D_TaskList',
      getPConnect: () => createMockPConnect(tasks, args.label),
      children: []
    };

    return (
      <Card>
        <CardHeader>
          <Text variant='h2'>Auth Case Type - All Complete</Text>
          <Text variant='secondary'>Button text changes based on caseType prop</Text>
        </CardHeader>
        <CardContent>
          <GdsTaskForceGdsTaskList {...props} />
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'Registration complete',
    showLabel: false,
    label: 'Registration Tasks',
    nCols: 1,
    caseType: 'Auth'
  }
};

/**
 * Task list with tasks that cannot be started yet
 */
export const WithBlockedTasks: Story = {
  render: args => {
    const tasks = [
      { name: 'Company Directors', status: 'completed' },
      { name: 'Registered company details', status: 'incomplete' },
      { name: 'Financial history', status: 'cannot-start', hint: 'Complete company details first' },
      { name: 'Business plan', status: 'cannot-start', hint: 'Complete financial history first' }
    ];

    const props = {
      heading: args.heading,
      showLabel: args.showLabel,
      label: args.label,
      nCols: args.nCols || 1,
      caseType: args.caseType || '',
      dataPage: 'D_TaskList',
      getPConnect: () => createMockPConnect(tasks, args.label),
      children: []
    };

    return (
      <Card>
        <CardHeader>
          <Text variant='h2'>Tasks with Dependencies</Text>
          <Text variant='secondary'>Some tasks cannot be started until prerequisites are completed</Text>
        </CardHeader>
        <CardContent>
          <GdsTaskForceGdsTaskList {...props} />
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'Application tasks',
    showLabel: false,
    label: 'Task List',
    nCols: 1,
    caseType: ''
  }
};

/**
 * Task list with detailed hint text
 */
export const WithDetailedHints: Story = {
  render: args => {
    const tasks = [
      {
        name: 'Personal information',
        status: 'completed',
        hint: 'Provide your full legal name, date of birth, and National Insurance number'
      },
      {
        name: 'Financial information',
        status: 'incomplete',
        hint: 'Include your bank statements for the last 3 months and proof of income'
      },
      {
        name: 'Supporting documents',
        status: 'not-started',
        hint: 'Upload copies of your passport, utility bills, and any relevant certificates'
      }
    ];

    const props = {
      heading: args.heading,
      showLabel: args.showLabel,
      label: args.label,
      nCols: args.nCols || 1,
      caseType: args.caseType || '',
      dataPage: 'D_TaskList',
      getPConnect: () => createMockPConnect(tasks, args.label),
      children: []
    };

    return (
      <Card>
        <CardHeader>
          <Text variant='h2'>Tasks with Detailed Hints</Text>
        </CardHeader>
        <CardContent>
          <GdsTaskForceGdsTaskList {...props} />
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'Complete your application',
    showLabel: false,
    label: 'Application Tasks',
    nCols: 1,
    caseType: ''
  }
};

/**
 * Empty task list with no tasks available
 */
export const Empty: Story = {
  render: args => {
    const props = {
      heading: args.heading,
      showLabel: args.showLabel,
      label: args.label,
      nCols: args.nCols || 1,
      caseType: args.caseType || '',
      dataPage: 'D_TaskList',
      getPConnect: () => createMockPConnect([], args.label),
      children: []
    };

    return (
      <Card>
        <CardHeader>
          <Text variant='h2'>Empty Task List</Text>
        </CardHeader>
        <CardContent>
          <GdsTaskForceGdsTaskList {...props} />
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'No tasks available',
    showLabel: false,
    label: 'Task List',
    nCols: 1,
    caseType: ''
  }
};

/**
 * Task list with label shown
 */
export const WithLabel: Story = {
  render: args => {
    const tasks = [
      { name: 'Complete eligibility check', status: 'completed' },
      { name: 'Submit required documents', status: 'incomplete' },
      { name: 'Attend interview', status: 'not-started' }
    ];

    const props = {
      heading: args.heading,
      showLabel: args.showLabel,
      label: args.label,
      nCols: args.nCols || 1,
      caseType: args.caseType || '',
      dataPage: 'D_TaskList',
      getPConnect: () => createMockPConnect(tasks, args.label),
      children: []
    };

    return (
      <Card>
        <CardHeader>
          <Text variant='h2'>Task List with Field Label</Text>
          <Text variant='secondary'>Shows the field group label above the task list</Text>
        </CardHeader>
        <CardContent>
          <GdsTaskForceGdsTaskList {...props} />
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'Application process',
    showLabel: true,
    label: 'Required Tasks',
    nCols: 1,
    caseType: ''
  }
};
