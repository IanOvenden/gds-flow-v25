import React, { useEffect, useMemo, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { BackButtonPortalContext } from '../FlowContainer/BackButtonPortalContext';

interface ActionButton {
  name: string;
  jsAction: string;
  type?: 'primary' | 'secondary';
  [key: string]: any;
}

interface ActionButtonsProps {
  getPConnect: () => any;
  arMainButtons?: ActionButton[];
  arSecondaryButtons?: ActionButton[];
  onButtonPress: (action: string, type: 'primary' | 'secondary', button?: ActionButton) => void;
}

const CYATARGET_SELECTOR = '#CYATarget';
const SPECIAL_PAGE_VALUE = 'ComplainantCYA';
const TASK_LIST_VIEW = 'StartTaskList';
const CYA_OPTION_VALUE = 'CYA';

const isRealPreviousButton = (btn: ActionButton) => btn?.jsAction === 'navigateToStep';

const pickPrimaryAdvanceButton = (buttons: ActionButton[]) => {
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

function setSelectToCyaIfPresent(): void {
  const selectEl = document.querySelector(CYATARGET_SELECTOR) as HTMLSelectElement | null;
  if (!selectEl) return;

  const hasCya = Array.from(selectEl.options).some(opt => opt.value === CYA_OPTION_VALUE);

  if (hasCya && selectEl.value !== CYA_OPTION_VALUE) {
    selectEl.value = CYA_OPTION_VALUE;
    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

const BackButton = ({ handleBackClick }: { handleBackClick: () => Promise<void> }) => {
  const portalTargetRef = useContext(BackButtonPortalContext);
  const portalTarget = portalTargetRef?.current;
  if (!portalTarget) return null;

  return createPortal(
    <a
      href='#'
      className='govuk-back-link'
      onClick={async e => {
        e.preventDefault();
        await handleBackClick();
      }}
    >
      Back
    </a>,
    portalTarget
  );
};

export default function ActionButtons({ getPConnect, arMainButtons = [], arSecondaryButtons = [], onButtonPress }: ActionButtonsProps) {
  const localizedVal = typeof PCore !== 'undefined' ? PCore.getLocaleUtils().getLocaleValue : undefined;
  const renderLabel = (name: string) => (localizedVal ? localizedVal(name, 'Assignment') : name);
  const cyaTargetPresent = useElementPresent(CYATARGET_SELECTOR);

  const pConnect = getPConnect();
  const caseContent = pConnect.getCaseInfo().getCurrentAssignmentViewName();
  const availableProcesses = pConnect.getCaseInfo().getAvailableProcesses?.() ?? [];

  const isSpecialCyaPage = caseContent === SPECIAL_PAGE_VALUE;
  const isTaskListView = caseContent === TASK_LIST_VIEW;

  const goToTaskListProcess = useMemo(() => availableProcesses?.find((p: any) => p.ID === 'GoToTaskList'), [availableProcesses]);

  const realPrevious = useMemo(() => arSecondaryButtons.find(b => isRealPreviousButton(b)), [arSecondaryButtons]);
  const primaryAdvance = useMemo(() => pickPrimaryAdvanceButton(arMainButtons), [arMainButtons]);

  const runRealPrevious = () => {
    if (realPrevious?.jsAction) {
      onButtonPress(realPrevious.jsAction, 'secondary', realPrevious);
    }
  };

  const runPrimaryAdvance = () => {
    const btn = primaryAdvance ?? arMainButtons[0];
    if (btn?.jsAction) {
      onButtonPress(btn.jsAction, 'primary', btn);
    }
  };

  const handleBackClick = async () => {
    const selectEl = document.querySelector(CYATARGET_SELECTOR) as HTMLSelectElement | null;
    const cyaValue = selectEl?.value;

    // Dependent question case
    if (caseContent === 'SelectPhoneTypeMobileLandlineWorkOther' && cyaTargetPresent && cyaValue === 'Phone Number') {
      runRealPrevious();
      return;
    }

    // If on EnterNameFirstMiddleLast stage without CYA, go back to task list
    const shouldGoToTaskList = caseContent === 'EnterNameFirstMiddleLast';

    if (shouldGoToTaskList && !cyaTargetPresent) {
      if (!goToTaskListProcess?.ID) {
        runRealPrevious();
        return;
      }

      try {
        const caseKey = pConnect.getCaseInfo().getKey();

        await pConnect.getActionsApi().openProcessAction(goToTaskListProcess.ID, {
          ...goToTaskListProcess,
          caseID: caseKey
        });
      } catch {
        runRealPrevious();
      }
      return;
    }

    // First pass → normal back
    if (!cyaTargetPresent) {
      runRealPrevious();
      return;
    }

    // Already on CYA → normal back
    if (cyaTargetPresent && isSpecialCyaPage) {
      runRealPrevious();
      return;
    }

    // Step → redirect to CYA
    if (cyaTargetPresent && !isSpecialCyaPage && !isTaskListView) {
      setSelectToCyaIfPresent();
      runPrimaryAdvance();
    }
  };

  if (!arMainButtons.length && !arSecondaryButtons.length) return null;

  return (
    <div className='govuk-button-group'>
      <BackButton handleBackClick={handleBackClick} />

      {arMainButtons
        .filter(btn => !(isTaskListView && btn.name?.toLowerCase() === 'continue'))
        .map(btn => (
          <button key={btn.name} className='govuk-button' onClick={() => onButtonPress(btn.jsAction, 'primary', btn)}>
            {renderLabel(btn.name)}
          </button>
        ))}

      {arSecondaryButtons
        .filter(b => !isRealPreviousButton(b) && !b.name?.toLowerCase().includes('cancel'))
        .map(btn =>
          btn.name?.toLowerCase().includes('later') ? null : (
            <button key={btn.name} className='govuk-button govuk-button--secondary' onClick={() => onButtonPress(btn.jsAction, 'secondary', btn)}>
              {renderLabel(btn.name)}
            </button>
          )
        )}

      {arSecondaryButtons
        .filter(b => !isRealPreviousButton(b) && !b.name?.toLowerCase().includes('cancel') && b.name?.toLowerCase().includes('later'))
        .map(btn => (
          <React.Fragment key={btn.name}>
            <a
              href='#'
              className='govuk-link'
              onClick={e => {
                e.preventDefault();
                onButtonPress(btn.jsAction, 'secondary', btn);
              }}
            >
              {renderLabel(btn.name)}
            </a>
          </React.Fragment>
        ))}
    </div>
  );
}
