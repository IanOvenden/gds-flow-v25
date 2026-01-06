import { useState, useEffect } from 'react';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';

interface TextInputProps extends PConnFieldProps {
  // If any, enter additional props that only exist on TextInput here
  fieldMetadata?: any;
}

export default function TextInput(props: TextInputProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    /* onChange, onBlur */
    readOnly,
    helperText,
    displayMode,
    hideLabel,
    placeholder
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  function handleChange(event) {
    // update internal value
    setInputValue(event?.target?.value);
  }

  function handleBlur() {
    handleEvent(actions, 'changeNblur', propName, inputValue);
  }

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} />;
  }

  return (
    <>
      <div className={'govuk-form-group' + (validatemessage ? ' govuk-form-group--error' : '')}>
        {!hideLabel ? (
          <h1 className='govuk-label-wrapper'>
            <label className='govuk-label govuk-label--l' htmlFor='event-name'>
              {label}
            </label>
          </h1>
        ) : null}
        {helperText ? (
          <div id='event-name-hint' className='govuk-hint'>
            {helperText}
          </div>
        ) : null}
        {validatemessage ? (
          <p id='event-name-error' className='govuk-error-message'>
            <span className='govuk-visually-hidden'>Error:</span>
            {validatemessage}
          </p>
        ) : null}
        <input
          required={required}
          placeholder={placeholder ? placeholder : undefined}
          className={'govuk-input' + (validatemessage ? ' govuk-input--error' : '')}
          id='event-name'
          name='eventName'
          type='text'
          disabled={disabled}
          onChange={handleChange}
          value={inputValue}
          onBlur={!readOnly ? handleBlur : undefined}
        />
      </div>
    </>
  );
}
