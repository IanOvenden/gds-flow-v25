import { NumericFormat } from 'react-number-format';
import { useEffect, useState } from 'react';
import { getCurrencyCharacters, getCurrencyOptions } from '@pega/react-sdk-components/lib/components/field/Currency/currency-utils';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';
import { format } from '@pega/react-sdk-components/lib/components/helpers/formatters';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';

/* Using react-number-format component here, since it allows formatting decimal values,
as per the locale.
*/

interface DecimalProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Decimal here
  currencyISOCode?: string;
  decimalPrecision?: number;
  showGroupSeparators?: boolean;
  formatter?: string;
}

export default function Decimal(props: DecimalProps) {
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
    helperText,
    displayMode,
    hideLabel,
    currencyISOCode = 'USD',
    decimalPrecision,
    showGroupSeparators,
    testId,
    placeholder,
    formatter
  } = props;

  const [values, setValues] = useState(value.toString());

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const fieldId = propName?.slice(propName.lastIndexOf('.') + 1) || 'decimal-field';

  const helperTextToDisplay = validatemessage || helperText;
  const hasError = status === 'error' && !!helperTextToDisplay;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const ariaDescribedBy = [helperTextToDisplay && !hasError ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ') || undefined;

  const theSymbols = getCurrencyCharacters(currencyISOCode);
  const theCurrDec = theSymbols.theDecimalIndicator;
  const theCurrSep = theSymbols.theDigitGroupSeparator;
  const theCurrSym = theSymbols.theCurrencySymbol;

  const theCurrencyOptions = getCurrencyOptions(currencyISOCode);

  useEffect(() => {
    setValues(value.toString());
  }, [value]);

  let formattedValue = '';
  if (formatter === 'Currency') {
    formattedValue = format(value, formatter.toLowerCase(), theCurrencyOptions);
  } else {
    formattedValue = format(value, pConn.getComponentName()?.toLowerCase(), theCurrencyOptions);
  }

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant='stacked' />;
  }

  if (readOnly) {
    return (
      <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`}>
        {label && (
          <label className={`govuk-label${hideLabel ? ' govuk-visually-hidden' : ''}`} htmlFor={fieldId}>
            {label}
          </label>
        )}
        <p className='govuk-body'>{formattedValue}</p>
      </div>
    );
  }

  function decimalOnBlur() {
    handleEvent(actions, 'changeNblur', propName, values);
  }

  const handleChange = (val: any) => {
    setValues(val.value);
  };

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

      <NumericFormat
        valueIsNumericString
        className={`govuk-input${hasError ? ' govuk-input--error' : ''}`}
        placeholder={placeholder ?? ''}
        required={required}
        disabled={disabled}
        value={values}
        onValueChange={val => {
          handleChange(val);
        }}
        onBlur={decimalOnBlur}
        prefix={formatter === 'Currency' ? theCurrSym : ''}
        suffix={formatter === 'Percentage' ? '%' : ''}
        decimalSeparator={theCurrDec}
        thousandSeparator={showGroupSeparators ? theCurrSep : ''}
        decimalScale={formatter === 'Currency' ? undefined : decimalPrecision}
        id={fieldId}
        name={fieldId}
        aria-describedby={ariaDescribedBy}
        data-test-id={testId}
      />
    </div>
  );
}
