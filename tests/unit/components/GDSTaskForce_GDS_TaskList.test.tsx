// @ts-nocheck
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GdsTaskForceGdsTaskList from '../../../src/components/custom-sdk/template/GDSTaskForce_GDS_TaskList';
import { TaskItem } from '../../../src/components/custom-sdk/template/GDSTaskForce_GDS_TaskList/types';

/**
 * Unit tests for GDS Task List component with D_TaskList data page
 */
describe('GdsTaskForceGdsTaskList', () => {
  /**
   * Creates a mock PConnect object with D_TaskList data page for testing
   */
  const createMockPConnect = (tasks: TaskItem[] = []) => {
    const dataPageResponse = {
      pxResults: tasks.map(task => ({
        pyID: task.id,
        pyLabel: task.name,
        pyStatusWork: task.status,
        pyDescription: task.hint,
        pyURL: task.href
      }))
    };

    return () => ({
      getDataObject: (dataPageName: string) => {
        if (dataPageName === 'D_TaskList') {
          return dataPageResponse;
        }
        return null;
      },
      getConfigProps: () => ({}),
      getInstructions: () => '',
      getLocalizedValue: (val: string) => val
    });
  };

  it('renders without crashing', async () => {
    const mockGetPConnect = createMockPConnect();
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);
    await waitFor(() => {
      expect(screen.getByText('No tasks available')).toBeInTheDocument();
    });
  });

  it('renders heading when provided', async () => {
    const mockGetPConnect = createMockPConnect();
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} heading='Test Heading' />);
    await waitFor(() => {
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
    });
  });

  it('renders task list with correct GDS classes', async () => {
    const tasks: TaskItem[] = [
      {
        id: 'task-1',
        name: 'Test Task',
        status: 'completed',
        href: '#test'
      }
    ];

    const mockGetPConnect = createMockPConnect(tasks);
    const { container } = render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(container.querySelector('.govuk-task-list')).toBeInTheDocument();
      expect(container.querySelector('.govuk-task-list__item')).toBeInTheDocument();
    });
  });

  it('renders multiple tasks', async () => {
    const tasks: TaskItem[] = [
      { id: 'task-1', name: 'Task 1', status: 'completed', href: '#1' },
      { id: 'task-2', name: 'Task 2', status: 'incomplete', href: '#2' },
      { id: 'task-3', name: 'Task 3', status: 'not-started', href: '#3' }
    ];

    const mockGetPConnect = createMockPConnect(tasks);
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  it('displays completed status correctly', async () => {
    const tasks: TaskItem[] = [{ id: 'task-1', name: 'Completed Task', status: 'completed', href: '#1' }];

    const mockGetPConnect = createMockPConnect(tasks);
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('displays incomplete status with GDS tag', async () => {
    const tasks: TaskItem[] = [{ id: 'task-1', name: 'Incomplete Task', status: 'incomplete', href: '#1' }];

    const mockGetPConnect = createMockPConnect(tasks);
    const { container } = render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(screen.getByText('Incomplete')).toBeInTheDocument();
      expect(container.querySelector('.govuk-tag--blue')).toBeInTheDocument();
    });
  });

  it('displays not-started status with GDS tag', async () => {
    const tasks: TaskItem[] = [{ id: 'task-1', name: 'Not Started Task', status: 'not-started', href: '#1' }];

    const mockGetPConnect = createMockPConnect(tasks);
    const { container } = render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(screen.getByText('Not yet started')).toBeInTheDocument();
      expect(container.querySelector('.govuk-tag--grey')).toBeInTheDocument();
    });
  });

  it('displays cannot-start status correctly', async () => {
    const tasks: TaskItem[] = [{ id: 'task-1', name: 'Blocked Task', status: 'cannot-start', href: '#1' }];

    const mockGetPConnect = createMockPConnect(tasks);
    const { container } = render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(screen.getByText('Cannot start yet')).toBeInTheDocument();
      expect(container.querySelector('.govuk-tag--grey')).toBeInTheDocument();
    });
  });

  it('renders hint text when provided', async () => {
    const tasks: TaskItem[] = [
      {
        id: 'task-1',
        name: 'Task with Hint',
        status: 'incomplete',
        hint: 'This is a helpful hint',
        href: '#1'
      }
    ];

    const mockGetPConnect = createMockPConnect(tasks);
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(screen.getByText('This is a helpful hint')).toBeInTheDocument();
    });
  });

  it('renders task links with correct href', async () => {
    const tasks: TaskItem[] = [{ id: 'task-1', name: 'Linked Task', status: 'incomplete', href: '#test-link' }];

    const mockGetPConnect = createMockPConnect(tasks);
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      const link = screen.getByText('Linked Task').closest('a');
      expect(link).toHaveAttribute('href', '#test-link');
    });
  });

  it('applies correct ARIA attributes', async () => {
    const tasks: TaskItem[] = [
      {
        id: 'task-1',
        name: 'Accessible Task',
        status: 'incomplete',
        hint: 'Accessibility hint',
        href: '#1'
      }
    ];

    const mockGetPConnect = createMockPConnect(tasks);
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      const link = screen.getByText('Accessible Task').closest('a');
      expect(link).toHaveAttribute('aria-describedby');
    });
  });

  it('displays message when no tasks are available', async () => {
    const mockGetPConnect = createMockPConnect([]);
    render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} />);

    await waitFor(() => {
      expect(screen.getByText('No tasks available')).toBeInTheDocument();
    });
  });

  it('handles instructions HTML safely', async () => {
    const mockGetPConnect = () => ({
      getDataObject: () => ({ pxResults: [] }),
      getConfigProps: () => ({}),
      getInstructions: () => '<p>Test instructions</p>',
      getLocalizedValue: (val: string) => val
    });

    const { container } = render(<GdsTaskForceGdsTaskList getPConnect={mockGetPConnect} instructions='<p>Test instructions</p>' />);

    await waitFor(() => {
      expect(container.querySelector('.govuk-body')).toBeInTheDocument();
    });
  });
});
