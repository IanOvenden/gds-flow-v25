import React, { useEffect, useMemo, useState } from 'react';

interface ActionButton {
  name: string;
  jsAction: string;
  type?: 'primary' | 'secondary';
  [key: string]: any;
}

interface ActionButtonsProps {
  arMainButtons?: ActionButton[];
  arSecondaryButtons?: ActionButton[];
  onButtonPress: (action: string, type: 'primary' | 'secondary', button?: ActionButton) => void;

  /**
   * Optional: if your colleague’s component has a task list refresh callback,
   * you can pass it in to reuse it here.
   */
  triggerRefresh?: () => void;
}

const CYATARGET_SELECTOR = '#CYATarget';
const SPECIAL_PAGE_VALUE = 'ComplainantCYA';
const CYA_OPTION_VALUE = 'CYA';

const isRealPreviousButton = (btn: ActionButton) => btn?.jsAction === 'navigateToStep';

const pickPrimaryAdvanceButton = (buttons: ActionButton[]) => {
  if (!buttons?.length) return undefined;
  const preferred = ['Continue', 'Next', 'Save and continue', 'Advance', 'Submit'];
  return buttons.find(b => preferred.includes(b.name)) ?? buttons[0];
};

function useElementPresent(selector: string): boolean {
  const [present, setPresent] = useState(false);

  useEffect(() => {
    const check = () => setPresent(!!document.querySelector(selector));
    check();

    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => obs.disconnect();
  }, [selector]);

  return present;
}

function getPCoreStore(): any | undefined {
  // @ts-ignore
  if (typeof PCore === 'undefined' || !PCore.getStore) return undefined;
  // @ts-ignore
  return PCore.getStore();
}

function usePegaSelector<T>(selector: (s: any) => T, initial: T): T {
  const [val, setVal] = useState<T>(() => {
    const s = getPCoreStore()?.getState?.();
    return s ? selector(s) : initial;
  });

  useEffect(() => {
    const store = getPCoreStore();
    if (!store?.subscribe || !store?.getState) return;

    const compute = () => setVal(selector(store.getState()));
    compute();

    const unsub = store.subscribe(compute);
    return () => unsub?.();
  }, [selector]);

  return val;
}

function setSelectToCyaIfPresent(): void {
  const selectEl = document.querySelector(CYATARGET_SELECTOR) as HTMLSelectElement | null;
  if (!selectEl) return;

  const hasCya = Array.from(selectEl.options).some(opt => opt.value === CYA_OPTION_VALUE);
  if (!hasCya) return;

  if (selectEl.value !== CYA_OPTION_VALUE) {
    selectEl.value = CYA_OPTION_VALUE;
    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function toV2EndpointFromHref(href?: string): string | undefined {
  if (!href || typeof href !== 'string') return undefined;

  const marker = '/api/application/v2/';
  const idx = href.indexOf(marker);

  if (idx >= 0) return href.substring(idx);

  const cleaned = href.startsWith('/') ? href : `/${href}`;
  if (cleaned.startsWith('/cases/')) return `/api/application/v2${cleaned}`;

  return `/api/application/v2${cleaned}`;
}

function getContextNameFallback(): string {
  try {
    // @ts-ignore
    const cu = PCore?.getContainerUtils?.();
    if (cu?.getActiveContainerItemName) {
      const name = cu.getActiveContainerItemName('primary');
      if (typeof name === 'string' && name.length) return name;
    }
  } catch {
    // ignore
  }
  return 'app/primary_1';
}

async function postChangeStageViaPCore(href: string) {
  // @ts-ignore
  const restClient = PCore.getRestClient?.();
  if (!restClient?.invokeCustomRestApi) {
    throw new Error('PCore REST client not available (invokeCustomRestApi missing).');
  }

  const endpoint = toV2EndpointFromHref(href);
  if (!endpoint) throw new Error('Could not build /api/application/v2 endpoint from href.');

  const contextName = getContextNameFallback();

  return restClient.invokeCustomRestApi(
    endpoint,
    {
      method: 'POST',
      body: {},
      withoutDefaultHeaders: false
    },
    contextName
  );
}

async function openNextAssignmentIfPossible(nextAssignmentInfo: any): Promise<boolean> {
  if (!nextAssignmentInfo?.ID || !nextAssignmentInfo?.className) return false;

  // @ts-ignore
  const containerName = PCore?.getConstants?.()?.PRIMARY ?? 'primary';

  // Try a few likely access points; will vary by app/version
  // @ts-ignore
  const candidates = [PCore?.getActionsApi?.(), PCore?.getContainerUtils?.()?.getActionsApi?.(containerName)].filter(Boolean);

  for (const api of candidates) {
    if (api?.openAssignment) {
      await api.openAssignment(nextAssignmentInfo.ID, nextAssignmentInfo.className, { containerName });
      return true;
    }
  }

  return false;
}

function publishAssignmentRefresh() {
  try {
    // @ts-ignore
    const pubsub = PCore.getPubSubUtils?.();
    // @ts-ignore
    const events = PCore.getConstants?.()?.PUB_SUB_EVENTS;

    const assignmentSubmission = events?.CASE_EVENTS?.ASSIGNMENT_SUBMISSION;

    if (pubsub?.publish && assignmentSubmission) {
      pubsub.publish(assignmentSubmission, {});
    }
  } catch {
    // ignore
  }
}

export default function ActionButtons(props: ActionButtonsProps) {
  const { arMainButtons = [], arSecondaryButtons = [], onButtonPress, triggerRefresh } = props;

  const localizedVal =
    // @ts-ignore
    typeof PCore !== 'undefined' ? PCore.getLocaleUtils().getLocaleValue : undefined;
  const localeCategory = 'Assignment';

  const renderLabel = (name: string) => (localizedVal ? localizedVal(name, localeCategory) : name);

  // Signals
  const cyaTargetPresent = useElementPresent(CYATARGET_SELECTOR);
  const caseContent = usePegaSelector(s => s?.data?.['app/primary_1']?.caseInfo?.content, undefined as any);
  const isSpecialCyaPage = caseContent === SPECIAL_PAGE_VALUE;

  const processHref = usePegaSelector(s => s?.data?.['app/primary_1']?.caseInfo?.availableProcesses?.[1]?.links?.add?.href, undefined as any) as
    | string
    | undefined;

  // Buttons
  const realPrevious = useMemo(() => arSecondaryButtons.find(b => isRealPreviousButton(b)), [arSecondaryButtons]);
  const primaryAdvance = useMemo(() => pickPrimaryAdvanceButton(arMainButtons), [arMainButtons]);

  const [isPosting, setIsPosting] = useState(false);

  const runRealPrevious = () => {
    if (realPrevious?.jsAction) {
      onButtonPress(realPrevious.jsAction, 'secondary', realPrevious);
    }
  };

  const runPrimaryAdvance = () => {
    const btn = primaryAdvance ?? arMainButtons[0];
    if (btn?.jsAction) {
      onButtonPress(btn.jsAction, 'primary', btn);
    } else {
      console.warn('Back clicked but no primary advance button was found.');
    }
  };

  const runStageChange = async () => {
    if (!processHref) {
      console.warn('Back clicked but process href was not found in PCore state.');
      return;
    }

    try {
      setIsPosting(true);

      const response = await postChangeStageViaPCore(processHref);
      console.log('Process API response:', response);

      const responseData = (response as any)?.data || response;
      const nextAssignmentInfo = responseData?.nextAssignmentInfo;

      const opened = await openNextAssignmentIfPossible(nextAssignmentInfo);

      // Always publish refresh; helps keep UI consistent
      publishAssignmentRefresh();

      // Optional: refresh task list if your app exposes this
      if (typeof triggerRefresh === 'function') {
        triggerRefresh();
      }

      if (!opened) {
        console.log('Next assignment could not be opened directly; refresh event published.');
      }
    } catch (error) {
      console.error('Error calling process API:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleBackClick = async () => {
    // 1) Special CYA page: keep previous exactly as platform provides
    if (isSpecialCyaPage) {
      runRealPrevious();
      return;
    }

    // 2) No real previous + CYATarget present: set to 'CYA' then run primary
    if (!realPrevious && cyaTargetPresent) {
      setSelectToCyaIfPresent();
      runPrimaryAdvance();
      return;
    }

    // 3) No real previous + no CYATarget: POST stage/process endpoint
    if (!realPrevious && !cyaTargetPresent) {
      await runStageChange();
      return;
    }

    // 4) Otherwise: use real previous
    runRealPrevious();
  };

  if (!arMainButtons.length && !arSecondaryButtons.length) return null;

  return (
    <div className='govuk-button-group'>
      <a
        href='#'
        className='govuk-back-link'
        onClick={e => {
          e.preventDefault();
          void handleBackClick();
        }}
        aria-disabled={isPosting ? 'true' : 'false'}
        style={{
          pointerEvents: isPosting ? 'none' : 'auto',
          opacity: isPosting ? 0.6 : 1
        }}
      >
        {isPosting ? 'Back…' : 'Back'}
      </a>

      {arMainButtons.map(button => (
        <button
          key={button.name}
          type='button'
          className='govuk-button'
          data-module='govuk-button'
          onClick={() => onButtonPress(button.jsAction, 'primary', button)}
        >
          {renderLabel(button.name)}
        </button>
      ))}

      {arSecondaryButtons
        .filter(b => !isRealPreviousButton(b))
        .map(button => (
          <button
            key={button.name}
            type='button'
            className='govuk-button govuk-button--secondary'
            data-module='govuk-button'
            onClick={() => onButtonPress(button.jsAction, 'secondary', button)}
          >
            {renderLabel(button.name)}
          </button>
        ))}
    </div>
  );
}
