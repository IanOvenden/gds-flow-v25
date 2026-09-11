import { useEffect, useState } from 'react';

import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';

interface EmailProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Email here
}

export default function Email(props: EmailProps) {
  // Get emitted components from map (so we can get any override that may exist)
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
  const fieldId = propName?.slice(propName.lastIndexOf('.') + 1) || 'email-field';

  const helperTextToDisplay = validatemessage || helperText;
  const hasError = status === 'error' && !!helperTextToDisplay;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const ariaDescribedBy = [helperTextToDisplay && !hasError ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ') || undefined;

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  if (readOnly) {
    return (
      <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`}>
        {label && (
          <label className={`govuk-label${hideLabel ? ' govuk-visually-hidden' : ''}`} htmlFor={fieldId}>
            {label}
          </label>
        )}
        <p className='govuk-body'>{inputValue}</p>
      </div>
    );
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
  }

  function handleBlur() {
    handleEvent(actions, 'changeNblur', propName, inputValue);
  }

  return (
    <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`}>
      {label && (
        <label className={`govuk-label${hideLabel ? ' govuk-visually-hidden' : ''}`} htmlFor={fieldId}>
          {label}
        </label>
      )}

      {helperTextToDisplay && !hasError && (
        <div id={hintId} className='govuk-hint'>
          {helperTextToDisplay}
        </div>
      )}

      {hasError && (
        <p id={errorId} className='govuk-error-message'>
          <span className='govuk-visually-hidden'>Error:</span> {helperTextToDisplay}
        </p>
      )}

      <input
        className={`govuk-input${hasError ? ' govuk-input--error' : ''}`}
        id={fieldId}
        name={fieldId}
        type='email'
        placeholder={placeholder ?? ''}
        value={inputValue}
        required={required}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        spellCheck='false'
        autoComplete='email'
        aria-describedby={ariaDescribedBy}
        data-test-id={testId}
      />
    </div>
  );
}
