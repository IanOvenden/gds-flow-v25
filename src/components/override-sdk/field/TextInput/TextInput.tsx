import { useState } from 'react';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';

interface TextInputProps extends PConnFieldProps {
  fieldMetadata?: any;
}

export default function TextInput(props: TextInputProps) {
  const { getPConnect, label, required, disabled, value = '', validatemessage, status, readOnly, testId, helperText, hideLabel } = props;

  const [inputValue, setInputValue] = useState(value);

  const thePConn = getPConnect();
  const actionsApi = thePConn.getActionsApi();
  const propName = (thePConn.getStateProps() as any).value;
  const refName = propName?.slice(propName.lastIndexOf('.') + 1);

  const hasError = status === 'error' && !!validatemessage;
  const hintId = `${refName}-hint`;
  const errorId = `${refName}-error`;

  const ariaDescribedBy = [helperText ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ') || undefined;

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.target.value;
    setInputValue(newValue);
    handleEvent(actionsApi, 'changeNblur', propName, newValue);
  };

  if (readOnly) {
    console.log(readOnly);
  }

  return (
    <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`}>
      <label className={`govuk-label${hideLabel ? ' govuk-visually-hidden' : ''}`} htmlFor={refName}>
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
        className={`govuk-input${hasError ? ' govuk-input--error' : ''}`}
        id={refName}
        name={refName}
        type='text'
        value={inputValue}
        required={required}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        onChange={handleChange}
        data-test-id={testId}
      />
    </div>
  );
}
