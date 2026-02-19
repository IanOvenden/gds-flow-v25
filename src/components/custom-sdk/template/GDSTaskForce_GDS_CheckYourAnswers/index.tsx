import { createElement, PropsWithChildren } from 'react';

import { getInstructions } from '@pega/react-sdk-components/lib/components/helpers/template-utils';
import createPConnectComponent from '@pega/react-sdk-components/lib/bridge/react_pconnect';
import connectToState from '@pega/react-sdk-components/lib/components/helpers/state-utils';

import { getKeyForMappedField, mapStateToProps } from './utils';
import { PConnProps } from '@pega/react-sdk-components/lib/types/PConnProps';

import './DefaultForm.css';
import StyledGdsTaskForceGdsCheckYourAnswersWrapper from './styles';

interface GdsTaskForceGdsCheckYourAnswersProps extends PConnProps {
  NumCols: string;
  instructions: string;
}

type QAEntry = {
  key: string;
  question: string;
  answer: string;
};

const QUESTION_TO_CYA_TARGET_VALUE: Record<string, string> = {
  'Complainant First Name': 'Name',
  'Complainant Middle Name': 'Name',
  'Complainant Last Name': 'Name',
  'Complainant Addresses': 'Address',
  ActivePhone: 'Phone Number'
};

const Child: React.ComponentType<any> = connectToState(mapStateToProps)((props: any) => {
  const { key, visibility, ...rest } = props;
  return createElement(createPConnectComponent(), { ...rest, key, visibility });
});

function toDisplayString(v: any): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Returns the question label for a kid:
 * - Prefer resolved config label
 * - Else look in resolvedConfig.inheritedProps for { prop: "label", value: "..." }
 * - Else raw metadata fallback
 */
function getQuestionLabel(pConn: any): string | undefined {
  let resolvedConfig: any = {};

  // Some SDK builds mutate the passed object; some return an object
  try {
    const maybeReturned = pConn?.getConfigProps?.(resolvedConfig);
    if (maybeReturned && typeof maybeReturned === 'object') {
      resolvedConfig = maybeReturned;
    }
  } catch {
    // ignore
  }

  const direct = resolvedConfig?.label;
  if (typeof direct === 'string' && direct.trim()) return direct;

  const inherited = resolvedConfig?.inheritedProps;
  if (Array.isArray(inherited)) {
    const labelObj = inherited.find((x: any) => x?.prop === 'label' && typeof x?.value === 'string');
    if (labelObj?.value?.trim?.()) return labelObj.value;
  }

  const raw = pConn?.getRawMetadata?.()?.config?.label ?? pConn?.getRawMetadata?.()?.label;

  if (typeof raw === 'string' && raw.trim()) return raw;

  return undefined;
}

/**
 * Reliable answer extraction (what worked for you before):
 * - Use property ref from stateProps.value
 * - Use pConn.getValue(propRef, pageRef) (fallback to getValue(propRef))
 */
function getAnswerFromKid(kid: any): string {
  try {
    const pConn = kid?.getPConnect?.();
    if (!pConn) return '';

    const stateProps = pConn.getStateProps?.();
    const propRef = stateProps?.value as string | undefined;
    if (!propRef) return '';

    const pageRef = pConn.getPageReference?.();

    let answer: any = undefined;

    if (pConn.getValue) {
      // Some builds support (propRef, pageRef), some only (propRef)
      answer = pConn.getValue(propRef, pageRef);
      if (answer === undefined) answer = pConn.getValue(propRef);
    }

    // Extra fallbacks (sometimes present depending on component)
    if (answer === undefined && kid?.value != null) answer = kid.value;
    if (answer === undefined && kid?.displayValue != null) answer = kid.displayValue;

    return toDisplayString(answer);
  } catch {
    return '';
  }
}

/**
 * Extract Q/A rows from children:
 * - Skip question === "CYA Target"
 * - If a kid has no propRef, skip it (likely layout/wrapper)
 */
function extractQAFromChildren(arChildren: any[]): QAEntry[] {
  if (!Array.isArray(arChildren)) return [];

  const out: QAEntry[] = [];

  for (const kid of arChildren) {
    const pConn = kid?.getPConnect?.();
    if (!pConn) continue;

    const question = getQuestionLabel(pConn);
    if (!question) continue;

    // Skip only CYA Target
    if (question === 'CYA Target') continue;

    const answer = getAnswerFromKid(kid);

    out.push({
      key: pConn.getStateProps?.()?.value ?? question ?? Math.random().toString(16),
      question,
      answer: answer ?? '' // Always include row
    });
  }

  return out;
}

function setCYATargetAndAdvance(targetValue: string) {
  const selectEl = document.querySelector('#CYATarget') as HTMLSelectElement | null;

  if (selectEl) {
    selectEl.value = targetValue;
    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Trigger primary action (Continue/Next)
  const primaryBtn = document.querySelector('.govuk-button-group .govuk-button') as HTMLButtonElement | null;
  primaryBtn?.click();
}

export default function GdsTaskForceGdsCheckYourAnswers(props: PropsWithChildren<GdsTaskForceGdsCheckYourAnswersProps>) {
  const { getPConnect, NumCols = '1' } = props;
  const instructions = getInstructions(getPConnect(), props.instructions);

  let divClass: string;
  const numCols = NumCols || '1';

  switch (numCols) {
    case '1':
      divClass = 'psdk-default-form-one-column';
      break;
    case '2':
      divClass = 'psdk-default-form-two-column';
      break;
    case '3':
      divClass = 'psdk-default-form-three-column';
      break;
    default:
      divClass = 'psdk-default-form-one-column';
      break;
  }

  // Children are inside a region; render the region's children (not the region wrapper)
  const arChildren = getPConnect().getChildren()[0].getPConnect().getChildren();

  const qaEntries = extractQAFromChildren(arChildren);

  // Render only non-QA children “as normal”.
  // We also keep the CYATarget component itself rendered (it will be hidden/shown by your Dropdown logic).
  const normalChildren = arChildren
    ?.filter((kid: any) => {
      const pConn = kid?.getPConnect?.();
      if (!pConn) return true;

      const propRef = pConn.getStateProps?.()?.value as string | undefined;
      if (!propRef) return true; // layout/wrapper/other

      const question = getQuestionLabel(pConn);
      if (!question) return true;

      // Keep CYATarget rendered (needed for navigation)
      if (question === 'CYA Target') return true;

      // All other Q/A fields are rendered in the summary list instead
      return false;
    })
    .map((kid: any) => <Child key={getKeyForMappedField(kid)} {...kid} />);

  return (
    <StyledGdsTaskForceGdsCheckYourAnswersWrapper>
      <>
        {instructions && (
          <div className='psdk-default-form-instruction-text'>
            <div key='instructions' id='instruction-text' dangerouslySetInnerHTML={{ __html: instructions }} />
          </div>
        )}

        {/* GOV.UK Summary List */}
        <div className='govuk-summary-list govuk-!-margin-bottom-9'>
          {qaEntries.map(({ key, question, answer }) => {
            const targetValue = QUESTION_TO_CYA_TARGET_VALUE[question] ?? question;

            return (
              <div className='govuk-summary-list__row' key={key}>
                <dt className='govuk-summary-list__key'>{question}</dt>

                <dd className='govuk-summary-list__value'>{answer && answer.trim() ? answer : '—'}</dd>

                <dd className='govuk-summary-list__actions'>
                  <a
                    href='#'
                    className='govuk-link'
                    onClick={e => {
                      e.preventDefault();
                      setCYATargetAndAdvance(targetValue);
                    }}
                  >
                    Change
                    <span className='govuk-visually-hidden'> {question?.toLowerCase()}</span>
                  </a>
                </dd>
              </div>
            );
          })}
        </div>

        {/* Any remaining children that should still render normally (incl. CYATarget) */}
        <div className={divClass}>{normalChildren}</div>
      </>
    </StyledGdsTaskForceGdsCheckYourAnswersWrapper>
  );
}
