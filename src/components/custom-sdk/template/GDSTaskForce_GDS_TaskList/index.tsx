import { PropsWithChildren, useState, useEffect, useCallback } from 'react';

import { getInstructions } from '@pega/react-sdk-components/lib/components/helpers/template-utils';

import { PConnProps } from '@pega/react-sdk-components/lib/types/PConnProps';
import { TaskItem } from './types';

import StyledGdsTaskForceGdsTaskListWrapper from './styles';

interface AvailableProcess {
  name: string;
  ID: string;
  type: string;
  links: {
    add: {
      rel: string;
      href: string;
      type: string;
      title: string;
    };
  };
}

interface GdsTaskForceGdsTaskListProps extends PConnProps {
  heading?: string;
  instructions?: string;
  dataPage?: string;
}

/**
 * Renders a GDS-compliant task list component
 * @param task - Task item to render
 * @param index - Index for generating unique IDs
 * @param onTaskClick - Handler for task click events
 */
const TaskListItem = ({ task, index, onTaskClick }: { task: TaskItem; index: number; onTaskClick?: (task: TaskItem) => void }) => {
  const statusId = `task-${index}-status`;
  const hintId = task.hint ? `task-${index}-hint` : undefined;
  const ariaDescribedBy = [hintId, statusId].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

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
        <a className='govuk-link govuk-task-list__link' href='#' onClick={handleClick} aria-describedby={ariaDescribedBy}>
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

  // Handle task click - call the process API
  const handleTaskClick = useCallback(
    async (task: TaskItem) => {
      if (!task.action) {
        console.warn('No action available for task:', task.name);
        return;
      }

      try {
        const pConnect = getPConnect();
        const processID = task.action.ID;

        console.log(`Calling process API for: ${processID}`);
        console.log('Process details:', task.action);

        // Get the case ID
        const dataObject = pConnect.getDataObject?.() as any;
        const caseID = dataObject?.caseInfo?.ID || pConnect.getValue?.('.pzInsKey') || pConnect.getValue?.('pzInsKey');

        if (!caseID) {
          console.error('Cannot call process: Case ID not found');
          return;
        }

        // Call the DX API: POST /cases/{caseID}/processes/{processID}
        // Use PCore's REST client which automatically handles authentication
        if (window.PCore) {
          const restClient = PCore.getRestClient();
          const endpoint = `/api/application/v2/cases/${caseID}/processes/${processID}`;

          const response = await restClient.invokeCustomRestApi(
            endpoint,
            {
              method: 'POST',
              body: {},
              withoutDefaultHeaders: false
            },
            pConnect.getContextName()
          );

          console.log('Process API response:', response);

          const responseData = (response as any)?.data || response;
          const nextAssignmentInfo = responseData?.nextAssignmentInfo;

          if (nextAssignmentInfo?.ID && nextAssignmentInfo?.className) {
            const actionsApi = pConnect.getActionsApi?.();
            if (actionsApi?.openAssignment) {
              const containerName = PCore.getConstants().PRIMARY;
              const contextName = pConnect.getContextName?.() || undefined;

              await actionsApi.openAssignment(nextAssignmentInfo.ID, nextAssignmentInfo.className, {
                containerName,
                context: contextName
              });
              return;
            }
          }

          // Refresh the work area to show the new assignment/view
          if (window.PCore) {
            // Trigger a refresh event to update the UI
            PCore.getPubSubUtils().publish(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION, {});
          }
        } else {
          console.warn('PCore not available');
        }
      } catch (error) {
        console.error('Error calling process API:', error);
      }
    },
    [getPConnect]
  );

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

  // Map available processes to task items based on name matching
  const mapActionToTask = useCallback((taskName: string, taskID: string, availableProcesses: AvailableProcess[]) => {
    // Normalize the task name for matching
    const normalizedTaskName = taskName.toLowerCase();
    const normalizedTaskID = taskID.toLowerCase();

    // Try to find a matching process
    const matchedProcess = availableProcesses.find(process => {
      const processName = process.name.toLowerCase();
      const processID = process.ID.toLowerCase();

      // Check for keyword matches (complaint, evidence, complainant, etc.)
      const keywords = ['complaint', 'evidence', 'complainant', 'submit'];

      for (const keyword of keywords) {
        if (
          (normalizedTaskName.includes(keyword) || normalizedTaskID.includes(keyword)) &&
          (processName.includes(keyword) || processID.includes(keyword))
        ) {
          return true;
        }
      }

      // Fallback: check if process name contains task name or vice versa
      return (
        processName.includes(normalizedTaskName) ||
        normalizedTaskName.includes(processName) ||
        processID.includes(normalizedTaskID) ||
        normalizedTaskID.includes(processID)
      );
    });

    return matchedProcess;
  }, []);

  // Fetch tasks from D_TaskList data page
  // eslint-disable-next-line sonarjs/cognitive-complexity
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

        // Extract available processes and actions from caseInfo
        const availableProcessesList = dataObject?.caseInfo?.availableProcesses || [];
        const availableActions = dataObject?.caseInfo?.availableActions || [];

        console.log('Available Processes:', availableProcessesList);
        console.log('Available Actions:', availableActions);

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
            const taskList: TaskItem[] = results.map((item: any, index: number) => {
              const taskName = item.TaskTitle || item.pyLabel || item.TaskName || item.pyName || 'Unnamed Task';
              const taskID = item.pyID || item.pzInsKey || `task-${index}`;

              // Find matching action for this task
              const matchedProcess = mapActionToTask(taskName, taskID, availableProcessesList);

              // Use the action href if available, otherwise fall back to task URL
              const taskHref = matchedProcess?.links?.add?.href || item.URL || item.pyURL || `#${taskID}`;

              console.log(`Mapping task "${taskName}" (${taskID}) to process:`, matchedProcess?.ID || 'none');

              return {
                id: taskID,
                name: taskName,
                status: normalizeStatus(item.Status || item.pyStatusWork || item.pyStatus || 'not-started'),
                hint: item.TaskDescription || item.Hint || item.pyDescription || item.Description,
                href: taskHref,
                action: matchedProcess // Store the matched process for potential future use
              };
            });
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
            const taskList: TaskItem[] = dataPageData.pxResults.map((item: any, index: number) => {
              const taskName = item.TaskTitle || item.pyLabel || item.TaskName || item.pyName || 'Unnamed Task';
              const taskID = item.pyID || item.pzInsKey || `task-${index}`;

              // Find matching action for this task
              const matchedProcess = mapActionToTask(taskName, taskID, availableProcessesList);

              // Use the action href if available, otherwise fall back to task URL
              const taskHref = matchedProcess?.links?.add?.href || item.URL || item.pyURL || `#${taskID}`;

              return {
                id: taskID,
                name: taskName,
                status: normalizeStatus(item.Status || item.pyStatusWork || item.pyStatus || 'not-started'),
                hint: item.TaskDescription || item.Hint || item.pyDescription || item.Description,
                href: taskHref,
                action: matchedProcess
              };
            });
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
  }, [getPConnect, dataPage, normalizeStatus, mapActionToTask]);

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
              <TaskListItem key={task.id || `task-${index}`} task={task} index={index} onTaskClick={handleTaskClick} />
            ))}
          </ul>
        ) : (
          <p className='govuk-body'>No tasks available</p>
        )}
      </>
    </StyledGdsTaskForceGdsTaskListWrapper>
  );
}
