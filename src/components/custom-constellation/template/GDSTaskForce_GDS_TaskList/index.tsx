import { useState, useEffect } from 'react';
import { Grid, FieldGroup, Text, SummaryList, Button, Icon, withConfiguration } from '@pega/cosmos-react-core';

import type { PConnFieldProps } from './PConnProps';
import './create-nonce';

import StyledGdsTaskForceGdsTaskListWrapper from './styles';

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

        // Try async fetch first if available
        if (window.PCore && window.PCore.getDataPageUtils && caseID) {
          try {
            const dataPageUtils = window.PCore.getDataPageUtils();
            const parameters = { CaseKey: caseID };

            const dataPageData = await dataPageUtils.getDataAsync(dataPage, getPConnect().getContextName(), parameters);

            const results = (dataPageData as any)?.data;
            if (results && Array.isArray(results)) {
              const tasks = results.map((item: any, index: number) => ({
                id: item.pyID || `preview-${index}`,
                name: item.TaskTitle || item.pyLabel || item.TaskName || `Task ${index + 1}`,
                status: item.Status || item.pyStatusWork || 'not-started',
                hint: item.Hint || item.pyDescription
              }));
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
          const tasks = dataPageData.pxResults.map((item: any, index: number) => ({
            id: item.pyID || `preview-${index}`,
            name: item.TaskTitle || item.pyLabel || item.TaskName || `Task ${index + 1}`,
            status: item.Status || item.pyStatusWork || 'not-started',
            hint: item.Hint || item.pyDescription
          }));
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
  }, [getPConnect, dataPage]);

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
    visual: <Icon name={task.status?.toLowerCase() === 'completed' ? 'check' : 'circle'} />
  }));

  const handleOnClick = (action: string) => {
    console.log('Task list action:', action);
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
