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

function setInputToCyaIfPresent(): void {
  const inputEl = document.querySelector(CYATARGET_SELECTOR) as HTMLInputElement | null;
  if (!inputEl) return;

  if (inputEl.value !== CYA_OPTION_VALUE) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(inputEl, CYA_OPTION_VALUE);
    }
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
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
    const inputEl = document.querySelector(CYATARGET_SELECTOR) as HTMLInputElement | null;
    const cyaValue = inputEl?.value;

    // Dependant question check - Check if CYA value is not in editable fields
    if (cyaTargetPresent) {
      const contextName = pConnect.getContextName();
      const editableFields = PCore.getFormUtils().getEditableFields(contextName) ?? [];

      const editableFieldNames = editableFields.map((field: any) => {
        const name = field.name ?? '';
        return name.startsWith('caseInfo.content.') ? name.replace('caseInfo.content.', '') : name;
      });

      // Check if CYA value matches exactly or matches before array notation (e.g., ComplainantAddresses matches ComplainantAddresses[0].Operation)
      const cyaMatchesEditableField = editableFieldNames.some((fieldName: string) => {
        const baseFieldName = fieldName.split('[')[0];
        return fieldName === cyaValue || baseFieldName === cyaValue;
      });

      if (!cyaMatchesEditableField) {
        runRealPrevious();
        return;
      }
    }

    // If navigateToStep action not found, no CYA target, and not on special pages, go back to task list
    const shouldGoToTaskList = !realPrevious && !cyaTargetPresent && !isSpecialCyaPage && !isTaskListView;

    if (shouldGoToTaskList) {
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
      setInputToCyaIfPresent();
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
