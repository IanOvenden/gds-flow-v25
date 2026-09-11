import { useState, useEffect, useContext, useRef } from 'react';

import StoreContext from '@pega/react-sdk-components/lib/bridge/Context/StoreContext';
import { Utils } from '@pega/react-sdk-components/lib/components/helpers/utils';
import { isContainerInitialized } from '@pega/react-sdk-components/lib/components/infra/Containers/container-helpers';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import { withSimpleViewContainerRenderer } from '@pega/react-sdk-components/lib/components/infra/Containers/SimpleView/SimpleView';
import { BackButtonPortalContext } from './BackButtonPortalContext';

import { addContainerItem, getToDoAssignments, showBanner, hasContainerItems } from './helpers';
import type { PConnProps } from '@pega/react-sdk-components/lib/types/PConnProps';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

interface FlowContainerProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  pageMessages: any[];
  rootViewElement: React.ReactNode;
  getPConnectOfActiveContainerItem: Function;
  assignmentNames: string[];
  activeContainerItemID: string;
}

const getFieldLabel = (pConnect: any, visited = new Set<any>()): string => {
  if (!pConnect || visited.has(pConnect)) return '';
  visited.add(pConnect);

  const children = pConnect.getChildren?.() || [];
  for (const child of children) {
    const childPConnect = child?.getPConnect?.() || child?.props?.getPConnect?.();
    const childConfig = childPConnect?.getConfigProps?.() || {};
    const resolvedConfig = childPConnect?.resolveConfigProps?.(childConfig) || childConfig;
    const label = child?.props?.label || resolvedConfig.label;

    if (typeof label === 'string' && label.trim()) {
      return label;
    }

    const nestedLabel = getFieldLabel(childPConnect, visited);
    if (nestedLabel) return nestedLabel;
  }

  return '';
};

const getRenderedFieldLabel = (node: any, visited = new Set<any>()): string => {
  if (!node || typeof node !== 'object' || visited.has(node)) return '';
  visited.add(node);

  const label = node.props?.label;
  if (typeof label === 'string' && label.trim()) return label;

  const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
  for (const child of children) {
    const childLabel = getRenderedFieldLabel(child, visited);
    if (childLabel) return childLabel;
  }

  return '';
};

//
// WARNING:  It is not expected that this file should be modified.  It is part of infrastructure code that works with
// Redux and creation/update of Redux containers and PConnect.  Modifying this code could have undesireable results and
// is totally at your own risk.
//

export const FlowContainer = (props: FlowContainerProps) => {
  // Get the proper implementation (local or Pega-provided) for these components that are emitted below
  const Assignment = getComponentFromMap('Assignment');
  const ToDo = getComponentFromMap('Todo'); // NOTE: ConstellationJS Engine uses "Todo" and not "ToDo"!!!
  const AlertBanner = getComponentFromMap('AlertBanner');
  const backButtonPortalRef = useRef<HTMLDivElement>(null);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const promotedFieldIdRef = useRef('');

  const pCoreConstants = PCore.getConstants();
  const { TODO } = pCoreConstants;
  const todo_headerText = 'To do';

  const {
    getPConnect: getPConnectOfFlowContainer,
    pageMessages,
    rootViewElement,
    getPConnectOfActiveContainerItem,
    assignmentNames,
    activeContainerItemID: itemKey
  } = props;

  const { displayOnlyFA } = useContext<any>(StoreContext);
  const pConnectOfFlowContainer = getPConnectOfFlowContainer();
  const isInitialized = isContainerInitialized(pConnectOfFlowContainer);
  const hasItems = isInitialized && hasContainerItems(pConnectOfFlowContainer);
  const getPConnect = getPConnectOfActiveContainerItem || getPConnectOfFlowContainer;
  const thePConn = getPConnect();
  const containerName = assignmentNames && assignmentNames.length > 0 ? assignmentNames[0] : '';
  const bShowBanner = showBanner(getPConnect);
  // const [init, setInit] = useState(true);
  // const [fcState, setFCState] = useState({ hasError: false });

  const [todo_showTodo, setShowTodo] = useState(false);
  const [todo_caseInfoID, setCaseInfoID] = useState('');
  const [todo_showTodoList, setShowTodoList] = useState(false);
  const [todo_datasource, setTodoDatasource] = useState({});
  const [renderedFieldLabel, setRenderedFieldLabel] = useState('');
  const [renderedFieldId, setRenderedFieldId] = useState('');

  const fieldLabel = renderedFieldLabel || getFieldLabel(thePConn) || getRenderedFieldLabel(rootViewElement);
  const pageHeading = fieldLabel || containerName;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [todo_context, setTodoContext] = useState('');

  const [caseMessages, setCaseMessages] = useState('');
  const [bHasCaseMessages, setHasCaseMessages] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [checkSvg, setCheckSvg] = useState('');

  const [buildName, setBuildName] = useState('');
  const [bShowConfirm, setShowConfirm] = useState(false);
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Messages';

  const key = getPConnect()?.getCaseLocaleReference();

  function getBuildName(): string {
    const ourPConn = getPConnect();

    const context = ourPConn.getContextName();
    let viewContainerName = ourPConn.getContainerName();

    if (!viewContainerName) viewContainerName = '';
    return `${context.toUpperCase()}/${viewContainerName.toUpperCase()}`;
  }

  function getTodoVisibility() {
    const caseViewMode = getPConnect().getValue('context_data.caseViewMode');
    if (caseViewMode && caseViewMode === 'review') {
      return true;
    }
    return !(caseViewMode && caseViewMode === 'perform');
  }

  function initComponent() {
    const ourPConn = getPConnect();

    // debugger;
    setShowTodo(getTodoVisibility());

    ourPConn.isBoundToState();

    // debugger;
    setBuildName(getBuildName());
  }

  useEffect(() => {
    // from WC SDK connectedCallback (mount)
    initComponent();
  }, []);

  useEffect(() => {
    const container = flowContainerRef.current;
    if (!container) return;
    setRenderedFieldLabel('');
    setRenderedFieldId('');
    promotedFieldIdRef.current = '';
    let updateTimer: number | undefined;

    const updateFieldLabel = () => {
      const fieldLabelElements = Array.from(container.querySelectorAll('label.govuk-label, legend.govuk-fieldset__legend')).filter(
        element => element.textContent?.trim() && !element.closest('h1')
      );
      const fieldControls = container.querySelectorAll('input, select, textarea');

      if (fieldControls.length === 1 && promotedFieldIdRef.current && fieldLabelElements.length === 1) {
        fieldLabelElements[0].remove();
        return;
      }

      if (fieldLabelElements.length === 0 && fieldControls.length === 1 && promotedFieldIdRef.current) {
        return;
      }

      if (fieldLabelElements.length !== 1 || fieldControls.length !== 1) {
        fieldLabelElements.forEach(element => element.removeAttribute('hidden'));
        promotedFieldIdRef.current = '';
        setRenderedFieldLabel('');
        setRenderedFieldId('');
        return;
      }

      const fieldLabelElement = fieldLabelElements[0];
      const fieldLabel = fieldLabelElement?.textContent?.trim() || '';

      if (fieldLabel) {
        setRenderedFieldLabel(fieldLabel);
        if (fieldLabelElement instanceof HTMLLabelElement) {
          promotedFieldIdRef.current = fieldLabelElement.htmlFor;
          setRenderedFieldId(fieldLabelElement.htmlFor);
        }
        fieldLabelElement.setAttribute('hidden', '');
      }
    };

    const scheduleUpdate = () => {
      if (updateTimer) window.clearTimeout(updateTimer);
      updateTimer = window.setTimeout(updateFieldLabel, 50);
    };

    scheduleUpdate();
    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (updateTimer) window.clearTimeout(updateTimer);
    };
  }, [itemKey]);

  useEffect(() => {
    if (!renderedFieldId) return;

    const container = flowContainerRef.current;
    const originalFieldLabel = Array.from(container?.querySelectorAll(`label[for="${renderedFieldId}"]`) || []).find(
      element => !element.closest('h1')
    );
    originalFieldLabel?.remove();
  }, [renderedFieldId]);

  useEffect(() => {
    // @ts-expect-error - Property 'getMetadata' is private and only accessible within class 'C11nEnv'
    if (isInitialized && pConnectOfFlowContainer.getMetadata().children && !hasItems) {
      // ensuring not to add container items, if container already has items
      // because during multi doc mode, we will have container items already in store
      addContainerItem(pConnectOfFlowContainer);
    }
  }, [isInitialized, hasItems]);

  // From SDK-WC updateSelf - so do this in useEffect that's run only when the props change...
  useEffect(() => {
    setBuildName(getBuildName());

    // routingInfo was added as component prop in populateAdditionalProps
    // let routingInfo = this.getComponentProp("routingInfo");

    let loadingInfo: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      loadingInfo = thePConn.getLoadingStatus();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (ex) {
      console.error(`${thePConn.getComponentName()}: loadingInfo catch block`);
    }

    const caseViewMode = thePConn.getValue('context_data.caseViewMode');
    const { CASE_INFO: CASE_CONSTS } = pCoreConstants;
    if (caseViewMode && caseViewMode === 'review') {
      setTimeout(() => {
        // updated for 8.7 - 30-Mar-2022
        const todoAssignments = getToDoAssignments(thePConn);
        setCaseInfoID(thePConn.getValue(CASE_CONSTS.CASE_INFO_ID));
        setTodoDatasource({ source: todoAssignments });
        setShowTodo(true);
        setShowTodoList(false);
      }, 100);
    } else if (caseViewMode && caseViewMode === 'perform') {
      // perform
      // debugger;
      setShowTodo(false);
    }

    // if have caseMessage show message and end
    const theCaseMessages = localizedVal(thePConn.getValue('caseMessages'), localeCategory);

    const rootInfo = PCore.getContainerUtils().getContainerItemData(getPConnect().getTarget(), itemKey);
    const bConfirmView = rootInfo && bShowBanner;

    if (bConfirmView) {
      // Temp fix for 8.7 change: confirmationNote no longer coming through in caseMessages$.
      // So, if we get here and caseMessages$ is empty, use default value in DX API response
      setCaseMessages(theCaseMessages || localizedVal('Thank you! The next step in this case has been routed appropriately.', localeCategory));
      setHasCaseMessages(true);
      setShowConfirm(true);

      // debugger;
      setCheckSvg(Utils.getImageSrc('check', Utils.getSDKStaticConentUrl()));
    } else {
      // debugger;
      setHasCaseMessages(false);
      setShowConfirm(false);
    }
  }, [props]);

  const caseId = thePConn.getCaseSummary().content.pyID;
  const urgency = getPConnect().getCaseSummary().assignments ? getPConnect().getCaseSummary().assignments?.[0].urgency : '';
  const operatorInitials = Utils.getInitials(PCore.getEnvironmentInfo().getOperatorName() || '');

  const displayPageMessages = () => {
    let hasBanner = false;
    const messages = pageMessages ? pageMessages.map(msg => localizedVal(msg.message, 'Messages')) : pageMessages;
    hasBanner = messages && messages.length > 0;
    return hasBanner && <AlertBanner id='flowContainerBanner' variant='urgent' messages={messages} />;
  };

  const renderPageHeading = () => {
    if (fieldLabel && renderedFieldId) {
      return (
        <h1 className='govuk-label-wrapper'>
          <label className='govuk-label govuk-label--l' htmlFor={renderedFieldId} hidden={false}>
            {pageHeading}
          </label>
        </h1>
      );
    }

    return <h1 className='govuk-heading-l'>{localizedVal(pageHeading, undefined, key)}</h1>;
  };

  return (
    <BackButtonPortalContext.Provider value={backButtonPortalRef}>
      <div ref={flowContainerRef} id={buildName} className='psdk-flow-container-top govuk-main-wrapper govuk-!-text-align-left'>
        {!bShowConfirm &&
          (!todo_showTodo ? (
            !displayOnlyFA ? (
              <section>
                <header id='assignment-header' className='govuk-!-margin-bottom-4'>
                  <div className='govuk-!-margin-bottom-2'>
                    <strong className='govuk-tag govuk-tag--blue psdk-avatar'>{operatorInitials}</strong>
                  </div>
                  <div ref={backButtonPortalRef} />
                  {renderPageHeading()}
                  <p className='govuk-body-s govuk-!-margin-bottom-0'>
                    {localizedVal('In', 'Todo')} {caseId} \u2022 {localizedVal('Priority', 'Todo')} {urgency}
                  </p>
                </header>
                {displayPageMessages()}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Assignment getPConnect={getPConnect} itemKey={itemKey}>
                    {rootViewElement}
                  </Assignment>
                </LocalizationProvider>
              </section>
            ) : (
              <section>
                <div ref={backButtonPortalRef} />
                {renderPageHeading()}
                {displayPageMessages()}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Assignment getPConnect={getPConnect} itemKey={itemKey}>
                    {rootViewElement}
                  </Assignment>
                </LocalizationProvider>
              </section>
            )
          ) : (
            <div>
              <ToDo
                key={Math.random()}
                getPConnect={getPConnect}
                caseInfoID={todo_caseInfoID}
                datasource={todo_datasource}
                showTodoList={todo_showTodoList}
                headerText={todo_headerText}
                type={TODO}
                context={todo_context}
                itemKey={itemKey}
                isConfirm
              />
            </div>
          ))}
        {bHasCaseMessages && (
          <div
            className='govuk-notification-banner govuk-notification-banner--success psdk-alert govuk-!-margin-left-2 govuk-!-margin-right-2'
            role='alert'
            aria-labelledby='flow-container-success-title'
            data-module='govuk-notification-banner'
          >
            <div className='govuk-notification-banner__header'>
              <h2 className='govuk-notification-banner__title' id='flow-container-success-title'>
                {localizedVal('Success', 'Messages')}
              </h2>
            </div>
            <div className='govuk-notification-banner__content'>
              <p className='govuk-notification-banner__heading'>{caseMessages}</p>
            </div>
          </div>
        )}
        {bShowConfirm && bShowBanner && <div>{rootViewElement}</div>}
      </div>
    </BackButtonPortalContext.Provider>
  );
};

export default withSimpleViewContainerRenderer(FlowContainer);
