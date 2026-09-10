import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Phone from "./Phone";
import handleEvent from "@pega/react-sdk-components/lib/components/helpers/event-utils";

jest.mock(
  "@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map",
  () => ({
    getComponentFromMap: (name: string) => {
      if (name === "FieldValueList") {
        return ({ name: fieldName, value, variant }: any) => (
          <div data-testid="field-value-list" data-variant={variant ?? ""}>
            {fieldName}: {value}
          </div>
        );
      }
      return null;
    },
  }),
);

jest.mock(
  "@pega/react-sdk-components/lib/components/helpers/event-utils",
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
);

const mockGetPConnect = () => ({
  getActionsApi: () => ({
    updateFieldValue: jest.fn(),
    triggerFieldChange: jest.fn(),
  }),
  getStateProps: () => ({ value: "testPhoneField" }),
});

const defaultProps: any = {
  getPConnect: mockGetPConnect as any,
  label: "Phone number",
  value: "",
};

describe("Phone (SDK)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the label", () => {
    render(<Phone {...defaultProps} />);
    expect(screen.getByText("Phone number")).toBeInTheDocument();
  });

  it("renders an input with govuk classes and type tel", () => {
    const { container } = render(<Phone {...defaultProps} />);
    const input = container.querySelector(".govuk-input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("govuk-input--width-20");
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("autocomplete", "tel");
  });

  it("wraps the field in a govuk-form-group", () => {
    const { container } = render(<Phone {...defaultProps} />);
    expect(container.querySelector(".govuk-form-group")).toBeInTheDocument();
  });

  it("renders hint text with govuk-hint class", () => {
    const { container } = render(
      <Phone {...defaultProps} helperText="For example, 07700 900123" />,
    );
    const hint = container.querySelector(".govuk-hint");
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent("For example, 07700 900123");
  });

  it("renders error message and applies error classes when status is error", () => {
    const { container } = render(
      <Phone
        {...defaultProps}
        status="error"
        validatemessage="Enter your phone number"
      />,
    );

    expect(
      container.querySelector(".govuk-form-group--error"),
    ).toBeInTheDocument();
    expect(container.querySelector(".govuk-input--error")).toBeInTheDocument();
    expect(container.querySelector(".govuk-error-message")).toHaveTextContent(
      "Enter your phone number",
    );
  });

  it('includes visually hidden "Error:" prefix in error message', () => {
    const { container } = render(
      <Phone
        {...defaultProps}
        status="error"
        validatemessage="Enter your phone number"
      />,
    );

    const hiddenPrefix = container.querySelector(
      ".govuk-error-message .govuk-visually-hidden",
    );
    expect(hiddenPrefix).toHaveTextContent("Error:");
  });

  it("supports disabled and readonly states", () => {
    const { rerender, container } = render(
      <Phone {...defaultProps} disabled />,
    );
    expect(container.querySelector("input")).toBeDisabled();

    rerender(<Phone {...defaultProps} readOnly value="07700 900123" />);
    expect(container.querySelector("input")).toHaveAttribute("readonly");
  });

  it("hides the label when hideLabel is true", () => {
    render(<Phone {...defaultProps} hideLabel />);
    expect(screen.queryByText("Phone number")).not.toBeInTheDocument();
  });

  it("renders the placeholder text", () => {
    const { container } = render(
      <Phone {...defaultProps} placeholder="07700 900123" />,
    );
    expect(container.querySelector("input")).toHaveAttribute(
      "placeholder",
      "07700 900123",
    );
  });

  it("syncs the input value when value prop changes", () => {
    const { rerender, container } = render(
      <Phone {...defaultProps} value="07700 900123" />,
    );
    expect(container.querySelector("input")).toHaveValue("07700 900123");

    rerender(<Phone {...defaultProps} value="07999 888777" />);
    expect(container.querySelector("input")).toHaveValue("07999 888777");
  });

  it("updates internal state on change", () => {
    const { container } = render(<Phone {...defaultProps} />);
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "07700 900123" } });
    expect(input).toHaveValue("07700 900123");
  });

  it("calls handleEvent on blur with normalized phone value", () => {
    const { container } = render(<Phone {...defaultProps} />);
    const input = container.querySelector("input") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "+44 7700 900123" } });
    fireEvent.blur(input);

    expect(handleEvent).toHaveBeenCalledWith(
      expect.anything(),
      "changeNblur",
      "testPhoneField",
      "+447700900123",
    );
  });

  it("does not call handleEvent on blur when readOnly", () => {
    const { container } = render(<Phone {...defaultProps} readOnly />);
    fireEvent.blur(container.querySelector("input") as HTMLInputElement);
    expect(handleEvent).not.toHaveBeenCalled();
  });

  it("renders FieldValueList for DISPLAY_ONLY mode", () => {
    render(
      <Phone
        {...defaultProps}
        value="07700 900123"
        displayMode="DISPLAY_ONLY"
      />,
    );
    expect(screen.getByTestId("field-value-list")).toHaveTextContent(
      "07700 900123",
    );
  });

  it("renders FieldValueList with stacked variant for STACKED_LARGE_VAL mode", () => {
    render(
      <Phone
        {...defaultProps}
        value="07700 900123"
        displayMode="STACKED_LARGE_VAL"
      />,
    );
    expect(screen.getByTestId("field-value-list")).toHaveAttribute(
      "data-variant",
      "stacked",
    );
  });

  it("links hint and error to input via aria-describedby", () => {
    const { container } = render(
      <Phone
        {...defaultProps}
        helperText="For example, 07700 900123"
        status="error"
        validatemessage="Enter your phone number"
      />,
    );

    const input = container.querySelector("input") as HTMLInputElement;
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain("-hint");
    expect(describedBy).toContain("-error");
  });
});
