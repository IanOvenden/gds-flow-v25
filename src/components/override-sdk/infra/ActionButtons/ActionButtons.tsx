import React, { useEffect, useMemo, useState } from 'react';
import { usePegaSelector } from '../../../../utils/pegaUtils';

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
}

const CYATARGET_SELECTOR = '#CYATarget';
const SPECIAL_PAGE_VALUE = 'ComplainantCYA';
const TASK_LIST_VIEW = 'StartTaskList';
const CYA_OPTION_VALUE = 'CYA';

const isRealPreviousButton = (btn: ActionButton) =>
  btn?.jsAction === 'navigateToStep';

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

  const hasCya = Array.from(selectEl.options).some(
    opt => opt.value === CYA_OPTION_VALUE
  );

  if (hasCya && selectEl.value !== CYA_OPTION_VALUE) {
    selectEl.value = CYA_OPTION_VALUE;
    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export default function ActionButtons({
  arMainButtons = [],
  arSecondaryButtons = [],
  onButtonPress
}: ActionButtonsProps) {

  const localizedVal =
    typeof PCore !== 'undefined'
      ? PCore.getLocaleUtils().getLocaleValue
      : undefined;

  const renderLabel = (name: string) =>
    localizedVal ? localizedVal(name, 'Assignment') : name;

  const cyaTargetPresent = useElementPresent(CYATARGET_SELECTOR);

  const caseContent = usePegaSelector(
    s => s?.data?.['app/primary_1']?.caseInfo?.content?.pyViewName,
    undefined as any
  );

  const isSpecialCyaPage = caseContent === SPECIAL_PAGE_VALUE;
  const isTaskListView = caseContent === TASK_LIST_VIEW;

  const realPrevious = useMemo(
    () => arSecondaryButtons.find(b => isRealPreviousButton(b)),
    [arSecondaryButtons]
  );

  const primaryAdvance = useMemo(
    () => pickPrimaryAdvanceButton(arMainButtons),
    [arMainButtons]
  );

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

  const handleBackClick = () => {
    const selectEl = document.querySelector(CYATARGET_SELECTOR) as HTMLSelectElement | null;
    const cyaValue = selectEl?.value;

    // Dependent question case
    if (
      caseContent === 'SelectPhoneTypeMobileLandlineWorkOther' &&
      cyaTargetPresent &&
      cyaValue === 'Phone Number'
    ) {
      runRealPrevious();
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
      <a
        href='#'
        className='govuk-back-link'
        onClick={e => {
          e.preventDefault();
          handleBackClick();
        }}
      >
        Back
      </a>

      {arMainButtons
        .filter(btn => !(isTaskListView && btn.name?.toLowerCase() === 'continue'))
        .map(btn => (
          <button
            key={btn.name}
            className='govuk-button'
            onClick={() => onButtonPress(btn.jsAction, 'primary', btn)}
          >
            {renderLabel(btn.name)}
          </button>
        ))}

      {arSecondaryButtons
        .filter(b => !isRealPreviousButton(b) && !b.name?.toLowerCase().includes('cancel'))
        .map(btn =>
          btn.name?.toLowerCase().includes('later') ? null : (
            <button
              key={btn.name}
              className='govuk-button govuk-button--secondary'
              onClick={() => onButtonPress(btn.jsAction, 'secondary', btn)}
            >
              {renderLabel(btn.name)}
            </button>
          )
        )}

      {arSecondaryButtons
        .filter(b =>
          !isRealPreviousButton(b) &&
          !b.name?.toLowerCase().includes('cancel') &&
          b.name?.toLowerCase().includes('later')
        )
        .map(btn => (
          <React.Fragment key={btn.name}>
            <div style={{ flexBasis: '100%', height: 0 }} />
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
