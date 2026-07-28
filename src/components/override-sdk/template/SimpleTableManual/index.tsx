import React, { createElement, useEffect, useRef, useState } from 'react';
import type { PConnProps } from '@pega/react-sdk-components/lib/types/PConnProps';
import { buildFieldsForTable, getContext } from '@pega/react-sdk-components/lib/components/helpers/simpleTableHelpers';
import { getReferenceList } from '@pega/react-sdk-components/lib/components/helpers/field-group-utils';
import createPConnectComponent from '@pega/react-sdk-components/lib/bridge/react_pconnect';

interface SimpleTableManualProps extends PConnProps {
  hideAddRow?: boolean;
  hideDeleteRow?: boolean;
  referenceList?: any[];
  children?: any[];
  renderMode?: string;
  presets?: any[];
  label?: string;
  showLabel?: boolean;
  dataPageName?: string;
  contextClass?: string;
  propertyLabel?: string;
  fieldMetadata?: any;
  editMode?: string;
  addAndEditRowsWithin?: any;
  viewForAddAndEditModal?: any;
  editModeConfig?: any;
  displayMode?: string;
  useSeparateViewForEdit?: any;
  viewForEditModal?: any;
  validatemessage?: string;
  required?: boolean;
}

export default function SimpleTableManual(props: SimpleTableManualProps) {
  const {
    getPConnect,
    referenceList = [],
    children,
    presets,
    renderMode,
    label: labelProp,
    showLabel,
    contextClass,
    hideAddRow,
    hideDeleteRow,
    propertyLabel,
    editMode,
    addAndEditRowsWithin,
    viewForAddAndEditModal,
    editModeConfig,
    displayMode,
    useSeparateViewForEdit,
    viewForEditModal,
    required,
    validatemessage
  } = props;

  const pConn = getPConnect();
  const context = pConn.getContextName();
  const [elements, setElementsData] = useState<any[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const readOnlyMode = renderMode === 'ReadOnly';
  const isDisplayModeEnabled = displayMode === 'DISPLAY_ONLY';
  const editableMode = renderMode === 'Editable';
  const allowEditingInModal =
    (editMode ? editMode === 'modal' : addAndEditRowsWithin === 'modal') && !(renderMode === 'ReadOnly' || isDisplayModeEnabled);
  const showDeleteButton = editableMode && !hideDeleteRow;
  const showAddRowButton = !readOnlyMode && !hideAddRow && !isDisplayModeEnabled;

  const defaultView = editModeConfig ? editModeConfig.defaultView : viewForAddAndEditModal;
  const bUseSeparateViewForEdit = editModeConfig ? editModeConfig.useSeparateViewForEdit : useSeparateViewForEdit;
  const editView = editModeConfig ? editModeConfig.editView : viewForEditModal;

  // Initialise the reference list in pConn (mirrors original behaviour)
  const resolvedList = getReferenceList(pConn);
  (pConn as any).setReferenceList(resolvedList);

  // resolved children come from React props (already processed by Pega SDK)
  const resolvedFields: any[] = (children as any)?.[0]?.children || (presets as any)?.[0]?.children?.[0]?.children || [];

  // primaryFieldsViewIndex is used by buildFieldsForTable to handle composite fields
  const primaryFieldsViewIndex = resolvedFields.findIndex((f: any) => f?.config?.value === 'pyPrimaryFields');

  const rawConfig = (pConn as any).getRawMetadata()?.config;
  const rawFields: any[] = rawConfig?.children?.[0]?.children || rawConfig?.presets?.[0]?.children?.[0]?.children || [];

  const { referenceListStr } = getContext(getPConnect());

  // Non-hidden raw fields – these map 1:1 with the elements built below
  const visibleRawFields = rawFields.filter((f: any) => !f?.config?.hide);

  // Build field defs to get resolved labels; pass false for showDeleteButton so
  // we don't get a DeleteIcon entry mixed in with the data columns
  const fieldDefs: any[] =
    rawFields.length > 0 && resolvedFields.length > 0
      ? buildFieldsForTable(rawFields, getPConnect(), false, {
          primaryFieldsViewIndex,
          fields: resolvedFields
        })
      : [];

  // Visible field defs (non-hidden, non-DeleteIcon) – same order as visibleRawFields
  const visibleFieldDefs = fieldDefs.filter((f: any) => !f?.meta?.config?.hide && f.cellRenderer !== 'DeleteIcon');

  // Pair each raw field with its resolved field def, then exclude the
  // management "Update/Delete" dropdown (it's replaced by card-level actions)
  const fieldPairs = visibleRawFields
    .map((rf: any, i: number) => ({ rawField: rf, fieldDef: visibleFieldDefs[i] }))
    .filter(({ fieldDef }: any) => fieldDef?.label !== 'Update/Delete');

  const displayRawFields = fieldPairs.map(({ rawField }: any) => rawField);
  const displayFieldDefs = fieldPairs.map(({ fieldDef }: any) => fieldDef);

  function buildElementsForTable() {
    const eleData: any[][] = [];
    referenceList.forEach((_element: any, index: number) => {
      const rowData: any[] = [];
      displayRawFields.forEach((item: any) => {
        // Clear the label so the component doesn't render its own label —
        // we render it as the summary list key instead.
        // Always force DISPLAY_ONLY: the card layout is read-only and editing
        // happens via a dedicated Change sub-flow (configured in Pega).
        item = {
          ...item,
          config: {
            ...item.config,
            label: '',
            displayMode: 'DISPLAY_ONLY'
          }
        };
        const referenceListData = getReferenceList(pConn);
        const isDatapage = referenceListData.startsWith('D_');
        const pageReferenceValue = isDatapage
          ? `${referenceListData}[${index}]`
          : `${pConn.getPageReference()}${referenceListData.substring(referenceListData.lastIndexOf('.'))}[${index}]`;
        const config = {
          meta: item,
          options: {
            context,
            pageReference: pageReferenceValue,
            referenceList: referenceListData,
            hasForm: true
          }
        };
        const view = (PCore as any).createPConnect(config);
        rowData.push(createElement(createPConnectComponent(), view));
      });
      eleData.push(rowData);
    });
    setElementsData(eleData);
  }

  // Rebuild whenever the reference list changes
  useEffect(() => {
    buildElementsForTable();
  }, [referenceList]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide the sibling MUI checkbox field ("Would you like to add an address?").
  // It is replaced functionally by the + Add button below.
  useEffect(() => {
    const formColumn = containerRef.current?.closest('.psdk-default-form-one-column');
    if (!formColumn) return;
    // Target any direct-child MuiFormControl-root siblings (the checkbox wrapper)
    formColumn.querySelectorAll<HTMLElement>(':scope > .MuiFormControl-root').forEach(el => {
      el.style.display = 'none'; // eslint-disable-line no-param-reassign
    });
  }, []); // run once on mount

  /** Find the Continue / submit button in the current assignment panel */
  const findContinueButton = (): HTMLButtonElement | undefined =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('button.govuk-button')).find(btn => btn.textContent?.trim() === 'Continue');

  const addRecord = () => {
    if (allowEditingInModal && defaultView) {
      (pConn as any)
        .getActionsApi()
        .openEmbeddedDataModal(defaultView, pConn, referenceListStr, referenceList.length, (PCore as any).getConstants().RESOURCE_STATUS.CREATE);
      return;
    }

    // Locate the hidden "Would you like to add an address?" MUI checkbox and
    // check it, then programmatically submit the form.
    const formColumn = containerRef.current?.closest('.psdk-default-form-one-column');
    const checkboxInput = formColumn?.querySelector<HTMLInputElement>('.MuiFormControl-root input[type="checkbox"]');

    if (checkboxInput) {
      if (!checkboxInput.checked) {
        // Click the MuiButtonBase span that wraps the input so React/MUI fires
        // the onChange handler and Pega registers the field update.
        const muiBtn = checkboxInput.closest<HTMLElement>('.MuiButtonBase-root');
        muiBtn?.click();
      }
      // Allow Pega a brief moment to process the field-change event, then submit.
      setTimeout(() => {
        findContinueButton()?.click();
      }, 400);
    } else {
      // Fallback: no hidden checkbox found, submit directly.
      findContinueButton()?.click();
    }

    getPConnect().clearErrorMessages({
      property: (getPConnect().getStateProps() as any)?.referenceList?.substring(1)
    });
  };

  const changeRecord = (index: number) => {
    (pConn as any)
      .getActionsApi()
      .openEmbeddedDataModal(
        bUseSeparateViewForEdit ? editView : defaultView,
        pConn,
        referenceListStr,
        index,
        (PCore as any).getConstants().RESOURCE_STATUS.UPDATE
      );
  };

  const deleteRecord = (index: number) => {
    (pConn as any).getListActions().deleteEntry(index);
  };

  const label = labelProp || propertyLabel;
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };
  const cardTitle = (propsToUse.label as string) || 'Item';
  const resultsCount = referenceList.length;

  return (
    <div ref={containerRef}>
      {propsToUse.label && (
        <h2 className={`govuk-heading-m${required ? ' govuk-label--required' : ''}`}>
          {propsToUse.label}
          {resultsCount > 0 && (
            <span className='govuk-caption-m' style={{ display: 'inline', marginLeft: '0.5em', fontSize: '0.85em' }}>
              {resultsCount} result{resultsCount !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
      )}

      {validatemessage && (
        <p className='govuk-error-message'>
          <span className='govuk-visually-hidden'>Error: </span>
          {validatemessage}
        </p>
      )}

      {referenceList.length === 0 ? (
        <p className='govuk-body'>No records found.</p>
      ) : (
        elements.map((rowElements, rowIndex) => (
          <div key={`summary-card-${rowIndex}`} className='govuk-summary-card'>
            <div className='govuk-summary-card__title-wrapper'>
              <h3 className='govuk-summary-card__title'>
                {cardTitle} {rowIndex + 1}
              </h3>

              {(!readOnlyMode && !isDisplayModeEnabled && !hideDeleteRow) || allowEditingInModal ? (
                <ul className='govuk-summary-card__actions'>
                  {allowEditingInModal && (
                    <li className='govuk-summary-card__action'>
                      <button
                        type='button'
                        className='govuk-link'
                        onClick={() => changeRecord(rowIndex)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        Change
                        <span className='govuk-visually-hidden'>
                          {' '}
                          {cardTitle} {rowIndex + 1}
                        </span>
                      </button>
                    </li>
                  )}
                  {!readOnlyMode && !isDisplayModeEnabled && !hideDeleteRow && (
                    <li className='govuk-summary-card__action'>
                      <button
                        type='button'
                        className='govuk-link'
                        onClick={() => deleteRecord(rowIndex)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        Delete
                        <span className='govuk-visually-hidden'>
                          {' '}
                          {cardTitle} {rowIndex + 1}
                        </span>
                      </button>
                    </li>
                  )}
                </ul>
              ) : null}
            </div>

            <div className='govuk-summary-card__content'>
              <dl className='govuk-summary-list'>
                {rowElements.map((element, colIndex) => {
                  const fieldDef = displayFieldDefs[colIndex];
                  return (
                    <div key={`row-${rowIndex}-col-${colIndex}`} className='govuk-summary-list__row'>
                      <dt className='govuk-summary-list__key'>{fieldDef?.label || ''}</dt>
                      <dd className='govuk-summary-list__value'>{element}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
        ))
      )}

      {showAddRowButton && (
        <p className='govuk-body' style={{ marginTop: '1rem' }}>
          <button
            type='button'
            className='govuk-link'
            onClick={addRecord}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit' }}
          >
            + Add
          </button>
        </p>
      )}
    </div>
  );
}
