import { useEffect, useState } from 'react';

import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';

interface IntegerProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Integer here
}

export default function Integer(props: IntegerProps) {
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
  const fieldId = propName?.slice(propName.lastIndexOf('.') + 1) || 'integer-field';

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

  function intOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Disallow "." and "," (separators) since this is an integer field
    // Mimics Pega Integer behavior (where separator characters are "eaten" if they're typed)
    const disallowedChars = ['.', ','];
    const theAttemptedValue = event.target.value;
    const lastChar = theAttemptedValue.slice(-1);

    const newValue = disallowedChars.includes(lastChar) ? theAttemptedValue.slice(0, -1) : theAttemptedValue;
    setInputValue(newValue);
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
        type='text'
        inputMode='numeric'
        pattern='[0-9]*'
        placeholder={placeholder ?? ''}
        value={inputValue}
        required={required}
        disabled={disabled}
        onChange={intOnChange}
        onBlur={handleBlur}
        aria-describedby={ariaDescribedBy}
        data-test-id={testId}
      />
    </div>
  );
}
