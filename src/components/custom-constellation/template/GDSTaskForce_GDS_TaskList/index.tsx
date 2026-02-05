import { useState, useEffect, useCallback } from 'react';
import { Grid, FieldGroup, Text, SummaryList, Button, Icon, withConfiguration } from '@pega/cosmos-react-core';

import type { PConnFieldProps } from './PConnProps';
import './create-nonce';

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

// interface for props
interface GdsTaskForceGdsTaskListProps extends PConnFieldProps {
  showLabel?: boolean;
  heading?: string;
  dataPage?: string;
  children?: any;
  nCols?: number;
  caseType?: string;
}

// props passed in combination of props from property panel (config.json) and run time props from Constellation
// any default values in config.pros should be set in defaultProps at bottom of this file
function GdsTaskForceGdsTaskList(props: GdsTaskForceGdsTaskListProps) {
  const { heading, label, showLabel, getPConnect, readOnly, displayMode, dataPage = 'D_TaskList', nCols = 1, caseType = '', children = [] } = props;
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };

  const [taskPreviews, setTaskPreviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cssClassHook = 'gds-task-list-constellation';

  // Handle task click - call the process API
  const handleTaskClick = useCallback(
    async (task: any) => {
      if (!task.action) {
        console.warn('[Constellation] No action available for task:', task.name);
        return;
      }

      try {
        const pConnect = getPConnect();
        const processID = task.action.ID;

        console.log(`[Constellation] Calling process API for: ${processID}`);
        console.log('[Constellation] Process details:', task.action);

        // Get the case ID
        const dataObject = pConnect.getDataObject?.() as any;
        const caseID = dataObject?.caseInfo?.ID || pConnect.getValue?.('.pzInsKey') || pConnect.getValue?.('pzInsKey');

        if (!caseID) {
          console.error('[Constellation] Cannot call process: Case ID not found');
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

          console.log('[Constellation] Process API response:', response);

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
          console.warn('[Constellation] PCore not available');
        }
      } catch (error) {
        console.error('[Constellation] Error calling process API:', error);
      }
    },
    [getPConnect]
  );

  // Normalize status from Pega to GDS format
  const normalizeStatus = useCallback((status: string): string => {
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

    // Extract keywords from task name (split by spaces and common separators)
    const taskKeywords = normalizedTaskName.split(/[\s_-]+/).filter(k => k.length > 2);

    // Score each process based on keyword matches
    const scoredProcesses = availableProcesses.map(process => {
      const processName = process.name.toLowerCase();
      const processID = process.ID.toLowerCase();
      let score = 0;

      // Check exact match first (highest priority)
      if (processName === normalizedTaskName || processID === normalizedTaskID) {
        score += 1000;
      }

      // Count how many task keywords appear in the process name or ID
      taskKeywords.forEach(keyword => {
        if (processName.includes(keyword)) {
          score += 10;
        }
        if (processID.includes(keyword)) {
          score += 10;
        }
      });

      // Bonus for "submit" keyword when task contains "submit"
      // (prioritize submit actions over capture/other actions)
      if (normalizedTaskName.includes('submit')) {
        if (processName.includes('submit') || processID.includes('submit')) {
          score += 20;
        }
      }

      // Bonus for "goto" prefix in process ID (Pega convention for UI flows)
      if (processID.startsWith('goto')) {
        score += 5;
      }

      // Fallback: check if process name contains task name or vice versa
      if (processName.includes(normalizedTaskName) || normalizedTaskName.includes(processName)) {
        score += 5;
      }
      if (processID.includes(normalizedTaskID) || normalizedTaskID.includes(processID)) {
        score += 5;
      }

      return { process, score };
    });

    // Sort by score descending and return the highest scoring process
    scoredProcesses.sort((a, b) => b.score - a.score);

    // Only return a match if score is > 0
    const bestMatch = scoredProcesses[0];
    if (bestMatch && bestMatch.score > 0) {
      console.log(`[Constellation Preview] Best match for "${taskName}": ${bestMatch.process.ID} (score: ${bestMatch.score})`);
      return bestMatch.process;
    }

    return undefined;
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);

        // Get the case ID from the DataObject caseInfo
        let caseID = '';
        const dataObject = getPConnect().getDataObject?.() as any;
        caseID = dataObject?.caseInfo?.ID || '';

        // Fallback options if ID is not in caseInfo
        if (!caseID) {
          caseID = getPConnect().getValue?.('.pzInsKey') || '';
        }
        if (!caseID) {
          caseID = getPConnect().getValue?.('pzInsKey') || '';
        }
        if (!caseID) {
          caseID = dataObject?.pzInsKey || '';
        }

        console.log('D_TaskList (Constellation) - Case ID:', caseID);
        console.log('D_TaskList (Constellation) - Context:', getPConnect().getContextName());

        // Extract available processes and actions from caseInfo
        const availableProcessesList = dataObject?.caseInfo?.availableProcesses || [];
        const availableActions = dataObject?.caseInfo?.availableActions || [];

        console.log('Available Processes (Constellation):', availableProcessesList);
        console.log('Available Actions (Constellation):', availableActions);

        // Try async fetch first if available
        if (window.PCore && window.PCore.getDataPageUtils && caseID) {
          try {
            const dataPageUtils = window.PCore.getDataPageUtils();
            const parameters = { CaseKey: caseID };

            const dataPageData = await dataPageUtils.getDataAsync(dataPage, getPConnect().getContextName(), parameters);

            console.log('D_TaskList (Constellation) dataPageData:', dataPageData);

            const results = (dataPageData as any)?.data || (dataPageData as any)?.pxResults;

            console.log('D_TaskList (Constellation) results:', results);

            if (results && Array.isArray(results)) {
              const tasks = results.map((item: any, index: number) => {
                const taskName = item.TaskTitle || item.pyLabel || item.TaskName || item.pyName || `Task ${index + 1}`;
                const taskID = item.pyID || item.pzInsKey || `preview-${index}`;

                // Find matching action for this task
                const matchedProcess = mapActionToTask(taskName, taskID, availableProcessesList);

                console.log(`[Constellation] Mapping task "${taskName}" (${taskID}) to process:`, matchedProcess?.ID || 'none');

                return {
                  id: taskID,
                  name: taskName,
                  status: normalizeStatus(item.Status || item.pyStatusWork || item.pyStatus || 'not-started'),
                  hint: item.TaskDescription || item.Hint || item.pyDescription || item.Description,
                  action: matchedProcess
                };
              });
              console.log('Mapped taskList (Constellation):', tasks);
              setTaskPreviews(tasks);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.info('D_TaskList async fetch failed in preview:', err);
          }
        }

        // Fallback to synchronous getDataObject for preview
        const dataPageData = getPConnect().getDataObject?.(dataPage);
        if (dataPageData && dataPageData.pxResults) {
          const tasks = dataPageData.pxResults.map((item: any, index: number) => {
            const taskName = item.TaskTitle || item.pyLabel || item.TaskName || item.pyName || `Task ${index + 1}`;
            const taskID = item.pyID || item.pzInsKey || `preview-${index}`;

            // Find matching action for this task
            const matchedProcess = mapActionToTask(taskName, taskID, availableProcessesList);

            return {
              id: taskID,
              name: taskName,
              status: normalizeStatus(item.Status || item.pyStatusWork || item.pyStatus || 'not-started'),
              hint: item.TaskDescription || item.Hint || item.pyDescription || item.Description,
              action: matchedProcess
            };
          });
          setTaskPreviews(tasks);
        } else {
          setTaskPreviews([]);
        }
      } catch (err) {
        console.info('D_TaskList data page not available in preview mode', err);
        setTaskPreviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [getPConnect, dataPage, normalizeStatus, mapActionToTask]);

  // Calculate completion statistics
  const completedSections = taskPreviews.filter(task => task.status?.toLowerCase() === 'completed').length;
  const totalSections = taskPreviews.length;

  // Convert task data to SummaryList items format
  const getStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { text: 'Completed', variant: 'success' as const };
      case 'incomplete':
        return { text: 'Incomplete', variant: 'warning' as const };
      case 'not-started':
        return { text: 'Not yet started', variant: 'default' as const };
      case 'cannot-start':
        return { text: 'Cannot start yet', variant: 'default' as const };
      default:
        return { text: 'Not yet started', variant: 'default' as const };
    }
  };

  const itemsToRender = taskPreviews.map(task => ({
    id: task.id,
    primary: task.name,
    secondary: task.hint,
    tag: getStatusTag(task.status),
    visual: <Icon name={task.status?.toLowerCase() === 'completed' ? 'check' : 'circle'} />,
    onClick: task.action ? () => handleTaskClick(task) : undefined
  }));

  const handleOnClick = (action: string) => {
    console.log('[Constellation] Task list action:', action);
    // In actual runtime, this would trigger navigation or submission
  };

  if (readOnly === true || displayMode === 'DISPLAY_ONLY') {
    return (
      <StyledGdsTaskForceGdsTaskListWrapper>
        <FieldGroup name={propsToUse.showLabel ? propsToUse.label : ''}>
          {heading && (
            <Text variant='h3' style={{ marginBottom: '1rem' }}>
              {heading}
            </Text>
          )}
          {isLoading ? (
            <Text variant='secondary'>Loading tasks...</Text>
          ) : (
            <>
              <Grid
                className={`constellation ${cssClassHook}`}
                container={{
                  cols: `repeat(${nCols}, minmax(0, 1fr))`,
                  gap: 2
                }}
              >
                {children[0]}
              </Grid>
              <div>
                <SummaryList
                  name={`You have completed ${completedSections} of ${totalSections} sections.`}
                  icon='clipboard-check-solid'
                  items={taskPreviews.length > 0 ? itemsToRender : []}
                  noItemsText='No tasks available. Configure D_TaskList data page to display tasks.'
                />
                {completedSections === totalSections && totalSections > 0 ? (
                  <Button variant='primary' compact={false} onClick={() => handleOnClick(caseType === 'Auth' ? 'Save And Continue' : 'Continue')}>
                    {caseType === 'Auth' ? 'Save And Continue' : 'Continue'}
                  </Button>
                ) : null}
              </div>
              <Grid
                className='u-hide'
                container={{
                  cols: `repeat(${nCols}, minmax(0, 1fr))`,
                  gap: 2
                }}
              >
                {children[1]}
              </Grid>
            </>
          )}
        </FieldGroup>
      </StyledGdsTaskForceGdsTaskListWrapper>
    );
  }

  return (
    <StyledGdsTaskForceGdsTaskListWrapper>
      <FieldGroup name={propsToUse.showLabel ? propsToUse.label : ''}>
        {heading && (
          <Text variant='h3' style={{ marginBottom: '1rem' }}>
            {heading}
          </Text>
        )}
        {isLoading ? (
          <Text variant='secondary'>Loading tasks...</Text>
        ) : (
          <>
            <Grid
              className={`constellation ${cssClassHook}`}
              container={{
                cols: `repeat(${nCols}, minmax(0, 1fr))`,
                gap: 2
              }}
            >
              {children[0]}
            </Grid>
            <div>
              <SummaryList
                name={`You have completed ${completedSections} of ${totalSections} sections.`}
                icon='clipboard-check-solid'
                items={taskPreviews.length > 0 ? itemsToRender : []}
                noItemsText='No tasks available. Configure D_TaskList data page to display tasks.'
              />
              {completedSections === totalSections && totalSections > 0 ? (
                <Button variant='primary' compact={false} onClick={() => handleOnClick(caseType === 'Auth' ? 'Save And Continue' : 'Continue')}>
                  {caseType === 'Auth' ? 'Save And Continue' : 'Continue'}
                </Button>
              ) : null}
            </div>
            <Grid
              className='u-hide'
              container={{
                cols: `repeat(${nCols}, minmax(0, 1fr))`,
                gap: 2
              }}
            >
              {children[1]}
            </Grid>
          </>
        )}
      </FieldGroup>
    </StyledGdsTaskForceGdsTaskListWrapper>
  );
}

export default withConfiguration(GdsTaskForceGdsTaskList);
