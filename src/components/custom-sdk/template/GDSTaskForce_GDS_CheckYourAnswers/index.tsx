import { createElement, Fragment, PropsWithChildren } from 'react';

import { getInstructions } from '@pega/react-sdk-components/lib/components/helpers/template-utils';
import { buildFieldsForTable } from '@pega/react-sdk-components/lib/components/helpers/simpleTableHelpers';
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

type QAAnswer = string | Record<string, any> | Record<string, any>[];

type QAEntry = {
  key: string;
  question: string;
  answer: QAAnswer;
  propRef?: string;
  // Field metadata label (e.g. "Flock Groups") used to title summary cards as "Flock Group 1", "Flock Group 2"...
  cardLabel?: string;
  // Property key -> display label for summary card rows (e.g. poultryType -> "Poultry type")
  propertyLabels?: Record<string, string>;
  // Property keys whose values are dates (e.g. dateAcquired) – formatted the same as other date answers
  dateProperties?: string[];
};

/** Formats an ISO-style date string as a long en-GB date (e.g. "15 January 2024"); returns the raw value if unparseable. */
function formatLongDate(value: string): string {
  try {
    const dateObj = new Date(value);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch {
    // If date parsing fails, use the raw value
  }
  return value;
}

/**
 * Resolves property labels and date-typed properties for a table-style (authorContext) field:
 * - Table columns, the same way SimpleTableManual does (label + column component type)
 * - Falls back to class property metadata for anything missed
 */
function getPropertyMeta(pConn: any, config: any, propName: string, keys: string[]): { labels: Record<string, string>; dateProperties: string[] } {
  const labels: Record<string, string> = {};
  const dateProperties = new Set<string>();

  try {
    const rawConfig = pConn.getRawMetadata?.()?.config;
    const rawFields: any[] = rawConfig?.children?.[0]?.children || rawConfig?.presets?.[0]?.children?.[0]?.children || [];
    const resolvedFields: any[] = config?.children?.[0]?.children || config?.presets?.[0]?.children?.[0]?.children || [];

    if (rawFields.length > 0 && resolvedFields.length > 0) {
      const primaryFieldsViewIndex = resolvedFields.findIndex((f: any) => f?.config?.value === 'pyPrimaryFields');
      buildFieldsForTable(rawFields, pConn, false, { primaryFieldsViewIndex, fields: resolvedFields }).forEach((fieldDef: any) => {
        if (!fieldDef?.name) return;
        if (fieldDef.label) labels[fieldDef.name] = fieldDef.label;
        if (fieldDef.meta?.type === 'Date') dateProperties.add(fieldDef.name);
      });
    }
  } catch {
    // ignore – fall back to property metadata below
  }

  const pageClass = pConn.getFieldMetadata?.(propName)?.pageClass;
  if (pageClass) {
    keys.forEach(key => {
      const propMeta = PCore.getMetadataUtils().getPropertyMetadata(key, pageClass) as any;
      if (!labels[key] && propMeta?.label) labels[key] = propMeta.label;
      if (propMeta?.type === 'Date') dateProperties.add(key);
    });
  }

  return { labels, dateProperties: [...dateProperties] };
}

function getCardTitle(entry: QAEntry, idx: number, total: number): string {
  if (entry.cardLabel) {
    const singular = entry.cardLabel.endsWith('s') ? entry.cardLabel.slice(0, -1) : entry.cardLabel;
    return `${singular} ${idx + 1}`;
  }
  return total > 1 ? `${entry.question} ${idx + 1}` : entry.question;
}

// Consecutive string answers share one summary list; object answers render as summary cards
type QASegment = { kind: 'list'; key: string; entries: QAEntry[] } | { kind: 'cards'; key: string; entry: QAEntry };

function isSystemField(key: string): boolean {
  return key === 'classID' || key.startsWith('py');
}

/** Normalises an object/array-of-objects answer into a list of objects (non-objects dropped). */
function toAnswerObjects(answer: QAAnswer): Record<string, any>[] {
  if (typeof answer === 'string') return [];
  const items = Array.isArray(answer) ? answer : [answer];
  return items.filter(item => typeof item === 'object' && item !== null);
}

function hasAnswer(answer: QAAnswer | undefined): boolean {
  if (answer === undefined) return false;
  if (typeof answer === 'string') return answer.trim() !== '';
  return toAnswerObjects(answer).length > 0;
}

function groupIntoSegments(entries: QAEntry[]): QASegment[] {
  const segments: QASegment[] = [];
  for (const entry of entries) {
    if (typeof entry.answer !== 'string') {
      segments.push({ kind: 'cards', key: `cards-${entry.key}`, entry });
      continue;
    }
    const last = segments[segments.length - 1];
    if (last?.kind === 'list') {
      last.entries.push(entry);
    } else {
      segments.push({ kind: 'list', key: `list-${entry.key}`, entries: [entry] });
    }
  }
  return segments;
}

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
 * Flattens a nested object/array answer into a display string for rendering,
 * skipping system fields (classID, py*).
 */
function formatContextPart(part: any): string {
  if (part === null || typeof part !== 'object') return toDisplayString(part);
  return Object.entries(part)
    .filter(([key]) => !isSystemField(key))
    .map(([, value]) => formatContextPart(value))
    .filter(val => val.trim())
    .join(', ');
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
 * Reliable answer extraction with formatter support:
 * - Use property ref from stateProps.value
 * - Use pConn.getValue(propRef, pageRef) (fallback to getValue(propRef))
 * - Apply formatter if available (e.g., Date-Long for date fields)
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

    // Apply date formatting if the field type is Date
    if (answer !== undefined && answer !== '' && typeof answer === 'string') {
      const metadata = pConn?.getRawMetadata?.();
      const fieldType = metadata?.type;

      if (fieldType === 'Date') {
        answer = formatLongDate(answer);
      }
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
    // Skip CYA TArget Index
    if (question === 'CYA Target Index') continue;

    const config = pConn.getConfigProps?.();

    if (config?.visibility === false) continue;

    const isAddress = config?.name?.includes('Address') || config?.authorContext?.includes('Address') || config?.context?.includes('Address');
    const usesAuthorContext = config?.authorContext;

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
    } else if (usesAuthorContext) {
      // Handle other components using authorContext (like LandParcel) - generic extraction
      const contextPath = config.authorContext;
      const rawPropRef = contextPath as string | undefined;
      const propRef = rawPropRef?.startsWith('.') ? rawPropRef.slice(1) : rawPropRef;
      const contextData = pConn.getValue?.(contextPath);
      const propName = PCore.getAnnotationUtils().getPropertyName(contextPath); // e.g. "FlockGroups"
      const cardLabel = pConn.getFieldMetadata(propName)?.label as string | undefined; // e.g. "Flock Groups"

      if (contextData !== undefined && contextData !== null) {
        let answer: QAAnswer = '';

        // If it's an object, extract meaningful fields (filter out system fields)
        if (typeof contextData === 'object') {
          const meaningfulParts = Object.entries(contextData)
            .filter(([key]) => key !== 'classID' && !key.startsWith('py'))
            .map(([, value]) => value)
            .filter(val => val && val.toString().trim());

          const hasObjectParts = meaningfulParts.some(part => typeof part === 'object' && part !== null);

          // Keep nested objects as-is so they can be worked with later
          answer = hasObjectParts ? (meaningfulParts as Record<string, any>[]) : meaningfulParts.join(', ');
        } else {
          answer = toDisplayString(contextData);
        }

        if (hasAnswer(answer)) {
          const answerKeys = [...new Set(toAnswerObjects(answer).flatMap(obj => Object.keys(obj)))];
          const propertyMeta = answerKeys.length > 0 ? getPropertyMeta(pConn, config, propName, answerKeys) : undefined;

          out.push({
            key: propRef ?? question ?? Math.random().toString(16),
            question,
            answer,
            propRef,
            cardLabel,
            propertyLabels: propertyMeta?.labels,
            dateProperties: propertyMeta?.dateProperties
          });
        }
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
    .filter((answer): answer is string => typeof answer === 'string' && answer.trim() !== '')
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

/** Finds the PConnect of the child field with the given label (e.g. the hidden CYA Target fields). */
function findChildPConnByLabel(arChildren: any[], label: string): any {
  const kid = arChildren?.find((child: any) => {
    const pConn = child?.getPConnect?.();
    return pConn && getQuestionLabel(pConn) === label;
  });
  return kid?.getPConnect?.();
}

/**
 * Writes a value straight into the Pega store via the field's actions API.
 * Setting the DOM input isn't enough: some field components (e.g. Integer) only commit on blur.
 */
function setFieldValue(pConn: any, value: string, label: string) {
  const propName = pConn?.getStateProps?.()?.value;
  if (!propName) {
    console.warn(`CheckYourAnswers: "${label}" field not found, value not set`);
    return;
  }
  const actions = pConn.getActionsApi();
  actions.updateFieldValue(propName, value);
  actions.triggerFieldChange(propName, value);
}

/**
 * Sets CYATarget (and, for summary card rows, the 1-based CYATargetIndex of the answer group)
 * then triggers the primary action.
 */
function setCYATargetAndAdvance(arChildren: any[], targetValue: string, targetIndex?: number) {
  setFieldValue(findChildPConnByLabel(arChildren, 'CYA Target'), targetValue, 'CYA Target');

  if (targetIndex !== undefined) {
    setFieldValue(findChildPConnByLabel(arChildren, 'CYA Target Index'), String(targetIndex), 'CYA Target Index');
  }

  // Trigger primary action (Continue/Next)
  const primaryBtn = document.querySelector('.govuk-button-group .govuk-button') as HTMLButtonElement | null;
  primaryBtn?.click();
}

function ChangeLink({ onChange, label }: { onChange?: () => void; label?: string }) {
  return (
    <a
      href='#'
      className='govuk-link'
      onClick={e => {
        e.preventDefault();
        onChange?.();
      }}
    >
      Change
      <span className='govuk-visually-hidden'> {label?.toLowerCase()}</span>
    </a>
  );
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
  const segments = groupIntoSegments(qaEntries);

  const goToChange = (propRef?: string, targetIndex?: number) =>
    propRef ? () => setCYATargetAndAdvance(arChildren, propRef, targetIndex) : undefined;

  // Render only non-QA children “as normal”.
  // We also keep the CYATarget component itself rendered (it will be hidden/shown by your Dropdown logic).
  const normalChildren = arChildren
    ?.filter((kid: any) => {
      const pConn = kid?.getPConnect?.();
      if (!pConn) return true;

      const propRef = pConn.getStateProps?.()?.value as string | undefined;
      const question = getQuestionLabel(pConn);

      // Exclude address and other authorContext components (already displayed in CYA summary)
      const config = pConn.getConfigProps?.();
      const isAddress = config?.name?.includes('Address') || config?.authorContext?.includes('Address') || config?.context?.includes('Address');
      const usesAuthorContext = config?.authorContext;
      if (isAddress || usesAuthorContext) return false;

      if (!propRef) return true; // layout/wrapper/other

      if (!question) return true;

      // Keep CYATarget rendered (needed for navigation)
      if (question === 'CYA Target') return true;
      // Keep CYA Index
      if (question === 'CYA Target Index') return true;

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

        {segments.map(segment => {
          if (segment.kind === 'list') {
            // GOV.UK Summary List for plain string answers
            return (
              <dl className='govuk-summary-list govuk-!-margin-bottom-9' key={segment.key}>
                {segment.entries.map(({ key, question, answer, propRef }) => (
                  <div className='govuk-summary-list__row' key={key}>
                    <dt className='govuk-summary-list__key'>{question}</dt>

                    <dd className='govuk-summary-list__value' style={{ whiteSpace: 'pre-wrap' }}>
                      {hasAnswer(answer) ? (answer as string) : '—'}
                    </dd>

                    <dd className='govuk-summary-list__actions'>
                      <ChangeLink onChange={goToChange(propRef)} label={question} />
                    </dd>
                  </div>
                ))}
              </dl>
            );
          }

          // GOV.UK Summary Card per object in the answer
          const { key, answer, propRef, propertyLabels, dateProperties } = segment.entry;
          const answerObjects = toAnswerObjects(answer);

          return (
            <Fragment key={segment.key}>
              {segment.entry.cardLabel && <h2 className='govuk-heading-m'>{segment.entry.cardLabel}</h2>}
              {answerObjects.map((answerObject, idx) => (
                <div className='govuk-summary-card' key={`${key}-${idx}`}>
                  <div className='govuk-summary-card__title-wrapper'>
                    <h2 className='govuk-summary-card__title'>{getCardTitle(segment.entry, idx, answerObjects.length)}</h2>
                  </div>
                  <div className='govuk-summary-card__content'>
                    <dl className='govuk-summary-list'>
                      {Object.entries(answerObject)
                        .filter(([prop]) => !isSystemField(prop))
                        .map(([prop, value]) => (
                          <div className='govuk-summary-list__row' key={prop}>
                            <dt className='govuk-summary-list__key'>{propertyLabels?.[prop] ?? prop}</dt>
                            <dd className='govuk-summary-list__value' style={{ whiteSpace: 'pre-wrap' }}>
                              {(dateProperties?.includes(prop) && typeof value === 'string' && value
                                ? formatLongDate(value)
                                : formatContextPart(value)) || '—'}
                            </dd>
                            <dd className='govuk-summary-list__actions'>
                              {/* CYATarget uses the machine-readable property key, not the display label */}
                              <ChangeLink onChange={goToChange(propRef && `${propRef}.${prop}`, idx + 1)} label={propertyLabels?.[prop] ?? prop} />
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>
              ))}
            </Fragment>
          );
        })}

        {/* Any remaining children that should still render normally (incl. CYATarget) */}
        <div className={divClass}>{normalChildren}</div>
      </>
    </StyledGdsTaskForceGdsCheckYourAnswersWrapper>
  );
}
