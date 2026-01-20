import { useEffect, useMemo, useState } from 'react';

import Utils from '@pega/react-sdk-components/lib/components/helpers/utils';
import { getDataPage } from '@pega/react-sdk-components/lib/components/helpers/data_page';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';

interface RadioButtonsProps extends PConnFieldProps {
  inline: boolean;
  fieldMetadata?: any;
}

type PegaPicklistOption = { key: string; value: string };

type RadioOption = {
  value: string;
  label: string;
  hint?: string;
};

const flattenParameters = (params = {}) => {
  const flatParams: any = {};
  Object.keys(params).forEach(k => {
    const { name, value } = (params as any)[k];
    flatParams[name] = value;
  });
  return flatParams;
};

const stripPropPath = (p?: string) => {
  if (!p) return p;
  let s = p;
  if (s.startsWith('@P')) s = s.substring(3);
  if (s.startsWith('.')) s = s.substring(1);
  return s;
};

export default function RadioButtons(props: RadioButtonsProps) {
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    value: currentValue = '',
    readOnly,
    validatemessage,
    helperText,
    status,
    required,
    inline,
    hideLabel,
    fieldMetadata,
    testId
  } = props;

  const pConn = getPConnect();
  const configProps = pConn.getConfigProps();
  const actionsApi = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const className = pConn.getCaseInfo().getClassName();
  const context = pConn.getContextName();

  const [selectedValue, setSelectedValue] = useState(currentValue);
  const [dataPageRadioOptions, setDataPageRadioOptions] = useState<RadioOption[] | null>(null);

  let configProperty = (pConn.getRawMetadata() as any)?.config?.value || '';
  configProperty = stripPropPath(configProperty) || '';

  const metaData = Array.isArray(fieldMetadata) ? fieldMetadata.filter((f: any) => f?.classID === className)[0] : fieldMetadata;
  const datasource = metaData?.datasource;

  let displayName = datasource?.propertyForDisplayText;
  displayName = displayName?.slice(displayName.lastIndexOf('.') + 1);

  const localeContext = datasource?.tableType === 'DataPage' ? 'datapage' : 'associated';
  const localeClass = localeContext === 'datapage' ? '@baseclass' : className;
  const localeName = localeContext === 'datapage' ? datasource?.name : configProperty;
  const localePath = localeContext === 'datapage' ? displayName : localeName;

  const localize = (text: string) => {
    return pConn.getLocalizedValue(text, localePath, pConn.getLocaleRuleNameFromKeys(localeClass, localeContext, localeName));
  };

  const pegaPicklistOptions = Utils.getOptionList(configProps, pConn.getDataObject('')) as PegaPicklistOption[];

  useEffect(() => {
    setSelectedValue(currentValue);
  }, [currentValue]);

  useEffect(() => {
    if (datasource?.tableType !== 'DataPage' || !datasource?.name) {
      setDataPageRadioOptions(null);
      return;
    }

    const storedValueProperty = stripPropPath(datasource.propertyForValue) || 'pyLabel';
    const displayLabelProperty = stripPropPath(datasource.propertyForDisplayText) || 'pyValueLabel';
    const params = datasource.parameters ? flattenParameters(datasource.parameters) : {};

    getDataPage(datasource.name, params, context).then((val: unknown) => {
      const rows = Array.isArray(val) ? (val as any[]) : [];

      const mapped: RadioOption[] = rows
        .map(row => {
          const storedValue = (row?.[storedValueProperty] ?? row?.pyLabel ?? '').toString();
          const displayLabel = (row?.[displayLabelProperty] ?? row?.pyValueLabel ?? row?.pyLabel ?? '').toString();
          const hintText = (row?.pyNote ?? '').toString();
          return { value: storedValue, label: displayLabel, hint: hintText };
        })
        .filter(o => o.value);

      setDataPageRadioOptions(mapped);
    });
  }, [datasource, context]);

  const resolvedRadioOptions: RadioOption[] = useMemo(() => {
    if (Array.isArray(dataPageRadioOptions)) return dataPageRadioOptions;

    return (pegaPicklistOptions || []).map(o => ({
      value: o.key,
      label: o.value,
      hint: ''
    }));
  }, [dataPageRadioOptions, pegaPicklistOptions]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setSelectedValue(nextValue);
    handleEvent(actionsApi, 'changeNblur', propName, nextValue);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    pConn.getValidationApi().validate(event.target.value, '');
  };

  const testProps: any = { 'data-test-id': testId };

  if (resolvedRadioOptions.length === 0) return null;

  if (readOnly) {
    const selectedLabel = resolvedRadioOptions.find(o => o.value === currentValue)?.label || currentValue;
    return <FieldValueList name={hideLabel ? '' : label} value={localize(selectedLabel)} />;
  }

  const baseIdRaw = (propName?.split('.').pop() || configProperty || 'radios').toString();
  const fieldId = baseIdRaw.replace(/[^\w-]/g, '');

  const groupHintId = `${fieldId}-hint`;
  const groupErrorId = `${fieldId}-error`;

  const hasError = status === 'error' && !!validatemessage;
  const groupHintText = !hasError ? helperText : undefined;

  const groupAriaDescribedBy = useMemo(() => {
    const ids: string[] = [];
    if (groupHintText) ids.push(groupHintId);
    if (hasError) ids.push(groupErrorId);
    return ids.length ? ids.join(' ') : undefined;
  }, [groupHintText, hasError, groupHintId, groupErrorId]);

  return (
    <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`} {...testProps}>
      <fieldset className='govuk-fieldset' aria-describedby={groupAriaDescribedBy}>
        <legend className={`govuk-fieldset__legend${hideLabel ? ' govuk-visually-hidden' : ''}`}>{label}</legend>

        {groupHintText ? (
          <div id={groupHintId} className='govuk-hint'>
            {groupHintText}
          </div>
        ) : null}

        {hasError ? (
          <p id={groupErrorId} className='govuk-error-message'>
            <span className='govuk-visually-hidden'>Error:</span> {validatemessage}
          </p>
        ) : null}

        <div className={`govuk-radios${inline ? ' govuk-radios--inline' : ''}`} data-module='govuk-radios'>
          {resolvedRadioOptions.map((option, idx) => {
            const optionId = idx === 0 ? fieldId : `${fieldId}-${idx + 1}`;
            const itemHint = (option.hint || '').trim();
            const itemHintId = `${optionId}-item-hint`;

            return (
              <div className='govuk-radios__item' key={option.value}>
                <input
                  className='govuk-radios__input'
                  id={optionId}
                  name={fieldId}
                  type='radio'
                  value={option.value}
                  checked={selectedValue === option.value}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required={required}
                  aria-describedby={itemHint ? itemHintId : undefined}
                />
                <label className='govuk-label govuk-radios__label' htmlFor={optionId}>
                  {localize(option.label)}
                </label>

                {itemHint ? (
                  <div id={itemHintId} className='govuk-hint govuk-radios__hint'>
                    {localize(itemHint)}
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
