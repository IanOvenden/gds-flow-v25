import { useState, useEffect } from 'react';

import Utils from '@pega/react-sdk-components/lib/components/helpers/utils';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';

interface RadioButtonsProps extends PConnFieldProps {
  inline: boolean;
  fieldMetadata?: any;
}

export default function RadioButtons(props: RadioButtonsProps) {
  const FieldValueList = getComponentFromMap('FieldValueList');

  const { getPConnect, label, value = '', readOnly, validatemessage, helperText, status, required, inline, hideLabel, fieldMetadata } = props;

  const [theSelectedButton, setSelectedButton] = useState(value);

  const thePConn = getPConnect();
  const theConfigProps = thePConn.getConfigProps();
  const actionsApi = thePConn.getActionsApi();
  const propName = (thePConn.getStateProps() as any).value;
  const className = thePConn.getCaseInfo().getClassName();

  let configProperty = (thePConn.getRawMetadata() as any)?.config?.value || '';
  configProperty = configProperty.startsWith('@P') ? configProperty.substring(3) : configProperty;
  configProperty = configProperty.startsWith('.') ? configProperty.substring(1) : configProperty;

  const metaData = Array.isArray(fieldMetadata) ? fieldMetadata.filter(field => field?.classID === className)[0] : fieldMetadata;

  let displayName = metaData?.datasource?.propertyForDisplayText;
  displayName = displayName?.slice(displayName.lastIndexOf('.') + 1);

  const localeContext = metaData?.datasource?.tableType === 'DataPage' ? 'datapage' : 'associated';
  const localeClass = localeContext === 'datapage' ? '@baseclass' : className;
  const localeName = localeContext === 'datapage' ? metaData?.datasource?.name : configProperty;
  const localePath = localeContext === 'datapage' ? displayName : localeName;

  const localize = (text: string) =>
    thePConn.getLocalizedValue(text, localePath, thePConn.getLocaleRuleNameFromKeys(localeClass, localeContext, localeName));

  const theOptions = Utils.getOptionList(theConfigProps, thePConn.getDataObject(''));

  useEffect(() => {
    setSelectedButton(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedButton(event.target.value);
    handleEvent(actionsApi, 'changeNblur', propName, event.target.value);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    thePConn.getValidationApi().validate(event.target.value, '');
  };

  const testProps: any = { 'data-test-id': props.testId };

  if (readOnly) {
    return <FieldValueList name={hideLabel ? '' : label} value={localize(value)} />;
  }

  const baseId = (propName?.split('.').pop() || configProperty || 'radios').replace(/[^\w-]/g, '');
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const hasError = status === 'error' && !!validatemessage;
  const hintText = !hasError ? helperText : undefined;

  const ariaDescribedBy = [hintText ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`} {...testProps}>
      <fieldset className='govuk-fieldset' aria-describedby={ariaDescribedBy}>
        <legend className={`govuk-fieldset__legend${hideLabel ? ' govuk-visually-hidden' : ''}`}>{label}</legend>

        {hintText ? (
          <div id={hintId} className='govuk-hint'>
            {hintText}
          </div>
        ) : null}

        {hasError ? (
          <p id={errorId} className='govuk-error-message'>
            <span className='govuk-visually-hidden'>Error:</span> {validatemessage}
          </p>
        ) : null}

        <div className={`govuk-radios${inline ? ' govuk-radios--inline' : ''}`} data-module='govuk-radios'>
          {theOptions.map((opt: any, idx: number) => {
            const optionId = idx === 0 ? baseId : `${baseId}-${idx + 1}`;
            const hint = typeof opt.value === 'string' ? opt.value.trim() : '';
            const itemHintId = `${optionId}-item-hint`;

            return (
              <div className='govuk-radios__item' key={opt.key}>
                <input
                  className='govuk-radios__input'
                  id={optionId}
                  name={baseId}
                  type='radio'
                  value={opt.key}
                  checked={theSelectedButton === opt.key}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required={required}
                  aria-describedby={hint ? itemHintId : undefined}
                />
                <label className='govuk-label govuk-radios__label' htmlFor={optionId}>
                  {localize(opt.key)}
                </label>

                {hint ? (
                  <div id={itemHintId} className='govuk-hint govuk-radios__hint'>
                    {localize(hint)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
