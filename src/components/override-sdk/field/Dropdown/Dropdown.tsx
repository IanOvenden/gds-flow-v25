import { useEffect, useState } from 'react';
import isDeepEqual from 'fast-deep-equal/react';
import Utils from '@pega/react-sdk-components/lib/components/helpers/utils';
import { getDataPage } from '@pega/react-sdk-components/lib/components/helpers/data_page';
import handleEvent from '@pega/react-sdk-components/lib/components/helpers/event-utils';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '@pega/react-sdk-components/lib/types/PConnProps';
import { usePegaSelector } from '../../../../utils/pegaUtils';

interface IOption {
  key: string;
  value: string;
}

const SPECIAL_PAGE_VALUE = 'ComplainantCYA';

const flattenParameters = (params = {}) => {
  const flatParams: any = {};
  Object.keys(params).forEach(key => {
    const { name, value: theVal } = (params as any)[key];
    flatParams[name] = theVal;
  });
  return flatParams;
};

const preProcessColumns = (columnList: any[]) =>
  columnList.map(col => ({
    ...col,
    value: col.value && col.value.startsWith('.') ? col.value.substring(1) : col.value
  }));

const getDisplayFieldsMetaData = (columnList: any[]) => {
  const displayColumns = columnList.filter(col => col.display === 'true');
  const metaDataObj: any = { key: '', primary: '', secondary: [] };
  const keyCol = columnList.filter(col => col.key === 'true');
  metaDataObj.key = keyCol.length > 0 ? keyCol[0].value : 'auto';
  for (let index = 0; index < displayColumns.length; index += 1) {
    if (displayColumns[index].primary === 'true') {
      metaDataObj.primary = displayColumns[index].value;
    } else {
      metaDataObj.secondary.push(displayColumns[index].value);
    }
  }
  return metaDataObj;
};

interface DropdownProps extends PConnFieldProps {
  datasource?: any[];
  onRecordChange?: any;
  fieldMetadata?: any;
  listType: string;
  deferDatasource?: boolean;
  datasourceMetadata?: any;
  parameters?: any;
  columns: any[];
}

export default function Dropdown(props: DropdownProps) {
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
    deferDatasource,
    datasourceMetadata,
    hideLabel,
    onRecordChange,
    fieldMetadata
  } = props;

  let { placeholder = '' } = props;
  const context = getPConnect().getContextName();
  let { listType, parameters, datasource = [], columns = [] } = props;

  placeholder = placeholder || 'Select...';

  const [options, setOptions] = useState<IOption[]>([]);
  const [theDatasource, setDatasource] = useState<any[] | null>(null);

  const thePConn = getPConnect();
  const actionsApi = thePConn.getActionsApi();
  const propName = (thePConn.getStateProps() as any).value;
  const className = thePConn.getCaseInfo().getClassName();
  const refName = propName?.slice(propName.lastIndexOf('.') + 1);

  const caseContent = usePegaSelector(s => s?.data?.['app/primary_1']?.caseInfo?.content?.pyViewName, undefined as any);
  const isSpecialCyaPage = caseContent === SPECIAL_PAGE_VALUE;

  if (!isDeepEqual(datasource, theDatasource)) {
    setDatasource(datasource);
  }

  if (deferDatasource && datasourceMetadata?.datasource?.name) {
    listType = 'datapage';
    datasource = datasourceMetadata.datasource.name;

    const { parameters: dataSourceParameters, propertyForDisplayText, propertyForValue } = datasourceMetadata.datasource;
    parameters = flattenParameters(dataSourceParameters);

    const displayProp = propertyForDisplayText.startsWith('@P') ? propertyForDisplayText.substring(3) : propertyForDisplayText;
    const valueProp = propertyForValue.startsWith('@P') ? propertyForValue.substring(3) : propertyForValue;

    columns = [
      { key: 'true', setProperty: 'Associated property', value: valueProp },
      { display: 'true', primary: 'true', useForSearch: true, value: displayProp }
    ];
  }

  columns = preProcessColumns(columns);

  useEffect(() => {
    if (theDatasource) {
      const list = Utils.getOptionList(props, getPConnect().getDataObject(''));
      const optionsList = [...list];
      optionsList.unshift({
        key: placeholder,
        value: thePConn.getLocalizedValue(placeholder, '', '')
      });
      setOptions(optionsList);
    }
  }, [theDatasource]);

  useEffect(() => {
    if (listType !== 'associated' && typeof datasource === 'string') {
      getDataPage(datasource, parameters, context).then((results: any) => {
        const optionsData: any[] = [];
        const displayColumn = getDisplayFieldsMetaData(columns);
        results?.forEach((element: any) => {
          const val = element[displayColumn.primary]?.toString();
          optionsData.push({
            key: element[displayColumn.key] || element.pyGUID,
            value: val
          });
        });
        optionsData.unshift({
          key: placeholder,
          value: thePConn.getLocalizedValue(placeholder, '', '')
        });
        setOptions(optionsData);
      });
    }
  }, []);

  const metaData = Array.isArray(fieldMetadata) ? fieldMetadata.filter(field => field?.classID === className)[0] : fieldMetadata;

  let displayName = metaData?.datasource?.propertyForDisplayText;
  displayName = displayName?.slice(displayName.lastIndexOf('.') + 1);

  const localeContext = metaData?.datasource?.tableType === 'DataPage' ? 'datapage' : 'associated';
  const localeClass = localeContext === 'datapage' ? '@baseclass' : className;
  const localeName = localeContext === 'datapage' ? metaData?.datasource?.name : refName;
  const localePath = localeContext === 'datapage' ? displayName : localeName;

  const localize = (text: string) =>
    thePConn.getLocalizedValue(text, localePath, thePConn.getLocaleRuleNameFromKeys(localeClass, localeContext, localeName));

  const testProps: any = {
    'data-test-id': testId
  };

  const handleChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = evt.target.value === placeholder ? '' : evt.target.value;
    handleEvent(actionsApi, 'changeNblur', propName, selectedValue);
    if (onRecordChange) onRecordChange(evt);
  };

  if (options.length === 0) return null;

  if (readOnly) {
    const selectedText = options.find(o => o.key === value)?.value || value;
    return <FieldValueList name={hideLabel ? '' : label} value={localize(selectedText)} />;
  }

  const selectId = refName || 'select';
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const shouldHide = !isSpecialCyaPage && selectId === 'CYATarget';

  const hasError = status === 'error' && !!validatemessage;
  const hintText = !hasError ? helperText : undefined;

  const ariaDescribedBy = [hintText ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`govuk-form-group${hasError ? ' govuk-form-group--error' : ''}`} style={shouldHide ? { display: 'none' } : undefined}>
      <label className={`govuk-label${hideLabel ? ' govuk-visually-hidden' : ''}`} htmlFor={selectId}>
        {label}
      </label>

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

      <select
        className={`govuk-select${hasError ? ' govuk-select--error' : ''}`}
        id={selectId}
        name={selectId}
        aria-describedby={ariaDescribedBy}
        required={required}
        disabled={disabled}
        onChange={handleChange}
        value={value === '' ? placeholder : value}
        {...testProps}
      >
        {options.map(option => (
          <option key={option.key} value={option.key}>
            {localize(option.value)}
          </option>
        ))}
      </select>
    </div>
  );
}
