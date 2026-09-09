import { useEffect, useState } from 'react';

import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';

interface PhoneProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Phone here
}

export default function Phone(props: PhoneProps) {
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    status,
    readOnly,
    testId,
    helperText,
    displayMode,
    hideLabel,
    placeholder
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;

  const [inputValue, setInputValue] = useState(value);
  useEffect(() => setInputValue(value), [value]);

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  const fieldId = (testId || propName || 'phone-number').replace(/[^a-zA-Z0-9_-]/g, '');
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const hasError = status === 'error' && !!validatemessage;
  const describedBy = [helperText && hintId, hasError && errorId].filter(Boolean).join(' ') || undefined;

  if (readOnly) {
    return (
      <div className='govuk-form-group'>
        <span className='govuk-label'>{hideLabel ? '' : label}</span>
        <p className='govuk-body' data-test-id={testId}>
          {value}
        </p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleEvent(actions, 'changeNblur', propName, e.target.value);
  };

  return (
    <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`}>
      <label className={`govuk-label${hideLabel ? ' govuk-visually-hidden' : ''}`} htmlFor={fieldId}>
        {label}
      </label>
      {helperText && (
        <div id={hintId} className='govuk-hint'>
          {helperText}
        </div>
      )}
      {hasError && (
        <p id={errorId} className='govuk-error-message'>
          <span className='govuk-visually-hidden'>Error:</span> {validatemessage}
        </p>
      )}
      <input
        className={`govuk-input govuk-input--width-20${hasError ? ' govuk-input--error' : ''}`}
        id={fieldId}
        name={fieldId}
        type='tel'
        autoComplete='tel'
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder ?? undefined}
        data-test-id={testId}
        aria-describedby={describedBy}
      />
    </div>
  );
}
