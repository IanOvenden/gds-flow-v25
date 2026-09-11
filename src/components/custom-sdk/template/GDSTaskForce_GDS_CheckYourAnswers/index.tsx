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
  propRef?: string;
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
      answer = pConn.getValue(propRef, pageRef);

      if (answer === undefined) {
        answer = pConn.getValue(propRef);
      }
    }

    if (answer === undefined && kid?.value != null) {
      answer = kid.value;
    }
    if (answer === undefined && kid?.displayValue != null) {
      answer = kid.displayValue;
    }

    return toDisplayString(answer);
  } catch (error) {
    console.error('Error in getAnswerFromKid:', error);
    return '';
  }
}

/**
 * Extract Q/A rows from children:
 * - Skip question === "CYA Target"
 * - If a kid has no propRef, skip it (likely layout/wrapper)
 * - For addresses, expand into separate rows (Address 1, Address 2, etc.)
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

    const config = pConn.getConfigProps?.();

    if (config?.visibility === false) continue;

    const isAddress = config?.name?.includes('Address') || config?.authorContext?.includes('Address') || config?.context?.includes('Address');

    if (isAddress) {
      // Handle address array - create separate entries for each address
      const contextPath = config?.authorContext || config?.context;
      const rawPropRef = contextPath as string | undefined;
      const propRef = rawPropRef?.startsWith('.') ? rawPropRef.slice(1) : rawPropRef;
      const addressData = pConn.getValue?.(contextPath);
      const addressesToProcess = Array.isArray(addressData) ? addressData : addressData ? [addressData] : [];

      if (addressesToProcess.length > 0) {
        addressesToProcess.forEach((address, idx) => {
          const addressLabel = addressesToProcess.length > 1 ? `${question} ${idx + 1}` : question;
          const addressParts = Object.entries(address)
            .filter(([key]) => key !== 'classID')
            .map(([, value]) => value)
            .filter(val => val && val.toString().trim());

          // Format with commas between fields and newlines between lines
          const formattedAddress = addressParts.join(',\n');

          out.push({
            key: propRef
              ? addressesToProcess.length > 1
                ? `${propRef}-${idx}`
                : propRef
              : addressesToProcess.length > 1
                ? `address-${idx}`
                : 'address',
            question: addressLabel,
            answer: formattedAddress,
            propRef
          });
        });
      }
    } else {
      // Regular field
      const answer = getAnswerFromKid(kid);
      const rawPropRef = pConn.getStateProps?.()?.value as string | undefined;
      const propRef = rawPropRef?.startsWith('.') ? rawPropRef.slice(1) : rawPropRef;
      out.push({
        key: propRef ?? question ?? Math.random().toString(16),
        question,
        answer: answer ?? '',
        propRef
      });
    }
  }

  return out;
}

function consolidateComplainantName(qaEntries: QAEntry[]): QAEntry[] {
  const nameFields = ['Complainant First Name', 'Complainant Middle Name', 'Complainant Last Name'];

  const hasAnyNameField = qaEntries.some(entry => nameFields.includes(entry.question));

  if (!hasAnyNameField) {
    return qaEntries;
  }

  const filtered = qaEntries.filter(entry => !nameFields.includes(entry.question));
  const nameParts = qaEntries
    .filter(entry => nameFields.includes(entry.question))
    .sort((a, b) => nameFields.indexOf(a.question) - nameFields.indexOf(b.question))
    .map(entry => entry.answer)
    .filter(answer => answer && answer.trim())
    .join(' ');

  if (nameParts) {
    const firstNamePropRef = qaEntries.find(entry => entry.question === 'Complainant First Name')?.propRef;
    filtered.splice(0, 0, {
      key: 'complainant-name',
      question: 'Complainant Name',
      answer: nameParts,
      propRef: firstNamePropRef
    });
  }

  return filtered;
}

function setCYATargetAndAdvance(targetValue: string) {
  const CYA_Target_Element = document.querySelector('#CYATarget') as HTMLSelectElement | null;

  if (CYA_Target_Element) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(CYA_Target_Element, targetValue);
    }
    CYA_Target_Element.dispatchEvent(new Event('input', { bubbles: true }));
    CYA_Target_Element.dispatchEvent(new Event('change', { bubbles: true }));
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

  const qaEntries = consolidateComplainantName(extractQAFromChildren(arChildren));

  // Render only non-QA children “as normal”.
  // We also keep the CYATarget component itself rendered (it will be hidden/shown by your Dropdown logic).
  const normalChildren = arChildren
    ?.filter((kid: any) => {
      const pConn = kid?.getPConnect?.();
      if (!pConn) return true;

      const propRef = pConn.getStateProps?.()?.value as string | undefined;
      const question = getQuestionLabel(pConn);

      // Exclude address components (already displayed in CYA summary)
      const config = pConn.getConfigProps?.();
      const isAddress = config?.name?.includes('Address') || config?.authorContext?.includes('Address') || config?.context?.includes('Address');
      if (isAddress) return false;

      if (!propRef) return true; // layout/wrapper/other

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
          {qaEntries.map(({ key, question, answer, propRef }) => {
            return (
              <div className='govuk-summary-list__row' key={key}>
                <dt className='govuk-summary-list__key'>{question}</dt>

                <dd className='govuk-summary-list__value' style={{ whiteSpace: 'pre-wrap' }}>
                  {answer && answer.trim() ? answer : '—'}
                </dd>

                <dd className='govuk-summary-list__actions'>
                  <a
                    href='#'
                    className='govuk-link'
                    onClick={e => {
                      e.preventDefault();
                      if (propRef) {
                        setCYATargetAndAdvance(propRef);
                      }
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
