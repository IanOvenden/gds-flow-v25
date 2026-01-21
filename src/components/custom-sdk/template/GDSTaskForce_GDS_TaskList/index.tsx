import { PropsWithChildren, useState, useEffect, useCallback } from 'react';

import { getInstructions } from '@pega/react-sdk-components/lib/components/helpers/template-utils';

import { PConnProps } from '@pega/react-sdk-components/lib/types/PConnProps';
import { TaskItem } from './types';

import StyledGdsTaskForceGdsTaskListWrapper from './styles';

interface GdsTaskForceGdsTaskListProps extends PConnProps {
  heading?: string;
  instructions?: string;
  dataPage?: string;
}

/**
 * Renders a GDS-compliant task list component
 * @param task - Task item to render
 * @param index - Index for generating unique IDs
 */
const TaskListItem = ({ task, index }: { task: TaskItem; index: number }) => {
  const statusId = `task-${index}-status`;
  const hintId = task.hint ? `task-${index}-hint` : undefined;
  const ariaDescribedBy = [hintId, statusId].filter(Boolean).join(' ');

  const renderStatus = () => {
    switch (task.status) {
      case 'completed':
        return (
          <div className='govuk-task-list__status' id={statusId}>
            Completed
          </div>
        );
      case 'incomplete':
        return (
          <div className='govuk-task-list__status' id={statusId}>
            <strong className='govuk-tag govuk-tag--blue'>Incomplete</strong>
          </div>
        );
      case 'not-started':
        return (
          <div className='govuk-task-list__status' id={statusId}>
            <strong className='govuk-tag govuk-tag--grey'>Not yet started</strong>
          </div>
        );
      case 'cannot-start':
        return (
          <div className='govuk-task-list__status' id={statusId}>
            <strong className='govuk-tag govuk-tag--grey'>Cannot start yet</strong>
          </div>
        );
      default:
        return (
          <div className='govuk-task-list__status' id={statusId}>
            Not yet started
          </div>
        );
    }
  };

  return (
    <li className='govuk-task-list__item govuk-task-list__item--with-link'>
      <div className='govuk-task-list__name-and-hint'>
        <a className='govuk-link govuk-task-list__link' href={task.href || '#'} aria-describedby={ariaDescribedBy}>
          {task.name}
        </a>
        {task.hint && (
          <div id={hintId} className='govuk-task-list__hint'>
            {task.hint}
          </div>
        )}
      </div>
      {renderStatus()}
    </li>
  );
};

// props passed in combination of props from property panel (config.json) and run time props from Constellation
export default function GdsTaskForceGdsTaskList(props: PropsWithChildren<GdsTaskForceGdsTaskListProps>) {
  const { getPConnect, heading, dataPage = 'D_TaskList' } = props;
  const instructions = getInstructions(getPConnect(), props.instructions);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Normalize status from Pega to GDS format
  const normalizeStatus = useCallback((status: string): TaskItem['status'] => {
    const normalized = status?.toLowerCase() || '';

    // Check incomplete first before complete to avoid false matches
    if (normalized.includes('incomplete') || normalized === 'open' || normalized === 'new') {
      return 'incomplete';
    }
    if (normalized.includes('complete') || normalized === 'resolved-completed') {
      return 'completed';
    }
    if (normalized.includes('cannot') || normalized === 'pending-approval') {
      return 'cannot-start';
    }

    return 'not-started';
  }, []);

  // Fetch tasks from D_TaskList data page
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const pConnect = getPConnect();

        // Get the case ID from the DataObject caseInfo
        const dataObject = pConnect.getDataObject?.() as any;
        let caseID = dataObject?.caseInfo?.ID || '';

        // Fallback options if ID is not in caseInfo
        if (!caseID) {
          caseID = pConnect.getValue?.('.pzInsKey') || '';
        }
        if (!caseID) {
          caseID = pConnect.getValue?.('pzInsKey') || '';
        }
        if (!caseID) {
          caseID = dataObject?.pzInsKey || '';
        }
        // Try getting from parent context
        if (!caseID && pConnect.getContextName) {
          const contextName = pConnect.getContextName();
          // Context name is often the case key
          if (contextName && contextName.includes('WORK')) {
            caseID = contextName;
          }
        }

        console.log('D_TaskList - Case ID:', caseID);
        console.log('D_TaskList - Context:', pConnect.getContextName());

        // Try to get data from PCore DataPageUtils first
        if (window.PCore && window.PCore.getDataPageUtils) {
          const dataPageUtils = window.PCore.getDataPageUtils();

          // Pass parameters object with CaseKey
          const parameters = { CaseKey: caseID };
          const dataPageData = await dataPageUtils.getDataAsync(dataPage, pConnect.getContextName(), parameters);

          console.log('D_TaskList dataPageData:', dataPageData);

          // getDataAsync returns { data: [] } structure
          const results = (dataPageData as any)?.data || (dataPageData as any)?.pxResults;

          console.log('D_TaskList results:', results);

          if (results && Array.isArray(results)) {
            // Map the data page results to TaskItem format
            const taskList: TaskItem[] = results.map((item: any, index: number) => ({
              id: item.pyID || item.pzInsKey || `task-${index}`,
              name: item.TaskTitle || item.pyLabel || item.TaskName || item.pyName || 'Unnamed Task',
              status: normalizeStatus(item.Status || item.pyStatusWork || item.pyStatus || 'not-started'),
              hint: item.Hint || item.pyDescription || item.Description,
              href: item.URL || item.pyURL || `#${item.pyID || index}`
            }));
            console.log('Mapped taskList:', taskList);
            setTasks(taskList);
          } else {
            console.log('No results found or results is not an array');
            setTasks([]);
          }
        } else {
          // Fallback to getDataObject for Storybook/local development
          const dataPageData = pConnect.getDataObject?.(dataPage);

          if (dataPageData && dataPageData.pxResults) {
            // Map the data page results to TaskItem format
            const taskList: TaskItem[] = dataPageData.pxResults.map((item: any, index: number) => ({
              id: item.pyID || item.pzInsKey || `task-${index}`,
              name: item.TaskTitle || item.pyLabel || item.TaskName || item.pyName || 'Unnamed Task',
              status: normalizeStatus(item.Status || item.pyStatusWork || item.pyStatus || 'not-started'),
              hint: item.Hint || item.pyDescription || item.Description,
              href: item.URL || item.pyURL || `#${item.pyID || index}`
            }));
            setTasks(taskList);
          } else {
            setTasks([]);
          }
        }
      } catch (error) {
        console.error('Error fetching tasks from data page:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [getPConnect, dataPage, normalizeStatus]);

  if (isLoading) {
    return (
      <StyledGdsTaskForceGdsTaskListWrapper>
        <p className='govuk-body'>Loading tasks...</p>
      </StyledGdsTaskForceGdsTaskListWrapper>
    );
  }

  return (
    <StyledGdsTaskForceGdsTaskListWrapper>
      <>
        {heading && <h2 className='govuk-heading-m'>{heading}</h2>}

        {instructions && (
          <div className='govuk-body'>
            {/* server performs sanitization method for instructions html content */}
            <div key='instructions' dangerouslySetInnerHTML={{ __html: instructions }} />
          </div>
        )}

        {tasks.length > 0 ? (
          <ul className='govuk-task-list'>
            {tasks.map((task, index) => (
              <TaskListItem key={task.id || `task-${index}`} task={task} index={index} />
            ))}
          </ul>
        ) : (
          <p className='govuk-body'>No tasks available</p>
        )}
      </>
    </StyledGdsTaskForceGdsTaskListWrapper>
  );
}
