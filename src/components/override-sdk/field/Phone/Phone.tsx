import { useState, useEffect, type ChangeEvent, type FocusEvent } from "react";

import handleEvent from "@pega/react-sdk-components/lib/components/helpers/event-utils";
import { getComponentFromMap } from "@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map";
import type { PConnFieldProps } from "@pega/react-sdk-components/lib/types/PConnProps";

interface PhoneProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Phone here
}

export default function Phone(props: PhoneProps) {
  const {
    getPConnect,
    label,
    required,
    disabled,
    value = "",
    validatemessage,
    status,
    readOnly,
    testId,
    helperText,
    displayMode,
    hideLabel,
    placeholder,
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;

  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  if (displayMode === "DISPLAY_ONLY") {
    const FieldValueList = getComponentFromMap("FieldValueList");
    return <FieldValueList name={hideLabel ? "" : label} value={value} />;
  }

  if (displayMode === "STACKED_LARGE_VAL") {
    const FieldValueList = getComponentFromMap("FieldValueList");
    return (
      <FieldValueList
        name={hideLabel ? "" : label}
        value={value}
        variant="stacked"
      />
    );
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const phoneValue = event?.target?.value ?? "";
    let phoneNumber = phoneValue.split(" ").slice(1).join();
    phoneNumber = phoneNumber
      ? `+${phoneValue && phoneValue.replace(/\D+/g, "")}`
      : "";
    handleEvent(actions, "changeNblur", propName, phoneNumber);
  }

  const hasError = status === "error";
  const inputId = testId ?? propName ?? "phone-input";
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedByIds = [
    helperText && hintId,
    hasError && validatemessage && errorId,
  ]
    .filter(Boolean)
    .join(" ");

  const formGroupClass = `govuk-form-group${hasError ? " govuk-form-group--error" : ""}`;
  const inputClass = `govuk-input govuk-input--width-20${hasError ? " govuk-input--error" : ""}`;

  return (
    <div className={formGroupClass}>
      {!hideLabel && (
        <h1 className="govuk-label-wrapper">
          <label className="govuk-label govuk-label--l" htmlFor={inputId}>
            {label}
          </label>
        </h1>
      )}
      {helperText && (
        <div className="govuk-hint" id={hintId}>
          {helperText}
        </div>
      )}
      {hasError && validatemessage && (
        <p className="govuk-error-message" id={errorId}>
          <span className="govuk-visually-hidden">Error:</span>{" "}
          {validatemessage}
        </p>
      )}
      <input
        className={inputClass}
        id={inputId}
        name={propName}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        spellCheck={false}
        value={inputValue}
        placeholder={placeholder ?? ""}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-describedby={describedByIds || undefined}
        data-test-id={testId}
        onChange={readOnly ? undefined : handleChange}
        onBlur={!readOnly ? handleBlur : undefined}
      />
    </div>
  );
}
