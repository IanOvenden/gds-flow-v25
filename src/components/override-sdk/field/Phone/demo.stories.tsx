import type { Meta, StoryObj } from "@storybook/react";
import Phone from "./Phone";

const mockGetPConnect = () => ({
  getActionsApi: () => ({
    updateFieldValue: () => {},
    triggerFieldChange: () => {},
  }),
  getStateProps: () => ({ value: "phoneField" }),
  getComponentName: () => "Phone",
});

const meta: Meta<typeof Phone> = {
  title: "override/field/Phone",
  component: Phone,
  tags: ["autodocs"],
  args: {
    getPConnect: mockGetPConnect as any,
    label: "What is your phone number?",
    value: "",
    required: false,
    disabled: false,
    readOnly: false,
    hideLabel: false,
    status: undefined,
    validatemessage: "",
    helperText: "",
    placeholder: "",
  },
  parameters: {
    docs: {
      description: {
        component:
          'The GDS Phone override replaces the Pega out-of-the-box phone field with GOV.UK Frontend text input styling using a native `type="tel"` input. Refer to https://design-system.service.gov.uk/components/text-input/ and phone number guidance at https://design-system.service.gov.uk/patterns/phone-numbers/.',
      },
    },
  },
  argTypes: {
    label: {
      control: "text",
      description: "Visible label for the input",
      table: { type: { summary: "string" } },
    },
    value: {
      control: "text",
      description: "Current value of the phone input",
      table: { type: { summary: "string" } },
    },
    helperText: {
      control: "text",
      description: "Hint text displayed below the label",
      table: { type: { summary: "string" } },
    },
    placeholder: {
      control: "text",
      description: "Placeholder text shown inside the input when empty",
      table: { type: { summary: "string" } },
    },
    required: {
      control: "boolean",
      description: "Marks the field as required",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Disables the input",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    readOnly: {
      control: "boolean",
      description: "Makes the input read-only",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    hideLabel: {
      control: "boolean",
      description: "Hides the visible label",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    status: {
      control: "select",
      options: [undefined, "error"],
      description: 'Validation status - set to "error" to show error styling',
      table: { type: { summary: "string" } },
    },
    validatemessage: {
      control: "text",
      description: 'Error message displayed when status is "error"',
      table: { type: { summary: "string" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Phone>;

export const Default: Story = {
  args: {
    label: "What is your phone number?",
  },
};

export const WithHint: Story = {
  args: {
    label: "What is your phone number?",
    helperText: "For example, 07700 900123",
  },
};

export const WithError: Story = {
  args: {
    label: "What is your phone number?",
    helperText: "For example, 07700 900123",
    status: "error",
    validatemessage: "Enter your phone number",
  },
};

export const Required: Story = {
  args: {
    label: "What is your phone number?",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "What is your phone number?",
    value: "07700 900123",
    disabled: true,
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: "What is your phone number?",
    placeholder: "07700 900123",
  },
};

export const WithValue: Story = {
  args: {
    label: "What is your phone number?",
    value: "07700 900123",
  },
};
