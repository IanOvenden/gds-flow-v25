# Create a new custom DX component

## Summary

The component is for rendering tabular data as a (https://design-system.service.gov.uk/components/task-list/)[UK Gov GDS Task List component]

## Context
Component created through the 'npm run create' command.  There are multiple types of component to choose from - details of the type and subtype for this component can be found below.

[https://docs.pega.com/bundle/platform/page/platform/user-experience/creating-custom-dx-components-con.html](Creating Constellation DX components - Pega Documentation)

"While the Constellation architecture has an extensive library of out-of-the-box assets, the framework provides tools for expanding the UI by adding Constellation digital experience (DX) components. This still-evolving framework helps early adopters build interfaces tailored to their specific business needs."


## Parameters
SDK design system: [Gov UK Frontend]
Component type: Layout Template
Component subtype: Form

## Functionality
Data passed on a caseview api response will be rendered as per the GDS task list component.  Initially this will simply be the name of the task and it's status.

Ensure the code is correctly typed.

### Example code
<ul class="govuk-task-list">
  <li class="govuk-task-list__item govuk-task-list__item--with-link">
    <div class="govuk-task-list__name-and-hint">
      <a class="govuk-link govuk-task-list__link" href="#" aria-describedby="company-details-1-status">
        Company Directors
      </a>
    </div>
    <div class="govuk-task-list__status" id="company-details-1-status">
      Completed
    </div>
  </li>
  <li class="govuk-task-list__item govuk-task-list__item--with-link">
    <div class="govuk-task-list__name-and-hint">
      <a class="govuk-link govuk-task-list__link" href="#" aria-describedby="company-details-2-status">
        Registered company details
      </a>
    </div>
    <div class="govuk-task-list__status" id="company-details-2-status">
      <strong class="govuk-tag govuk-tag--blue">
        Incomplete
      </strong>
    </div>
  </li>
  <li class="govuk-task-list__item govuk-task-list__item--with-link">
    <div class="govuk-task-list__name-and-hint">
      <a class="govuk-link govuk-task-list__link" href="#" aria-describedby="company-details-3-hint company-details-3-status">
        Financial history
      </a>
      <div id="company-details-3-hint" class="govuk-task-list__hint">
        Include 5 years of the company’s relevant financial information
      </div>
    </div>
    <div class="govuk-task-list__status" id="company-details-3-status">
      <strong class="govuk-tag govuk-tag--blue">
        Incomplete
      </strong>
    </div>
  </li>
  <li class="govuk-task-list__item govuk-task-list__item--with-link">
    <div class="govuk-task-list__name-and-hint">
      <a class="govuk-link govuk-task-list__link" href="#" aria-describedby="company-details-4-status">
        Business plan
      </a>
    </div>
    <div class="govuk-task-list__status" id="company-details-4-status">
      <strong class="govuk-tag govuk-tag--blue">
        Incomplete
      </strong>
    </div>
  </li>
  <li class="govuk-task-list__item govuk-task-list__item--with-link">
    <div class="govuk-task-list__name-and-hint">
      <a class="govuk-link govuk-task-list__link" href="#" aria-describedby="company-details-5-status">
        References
      </a>
    </div>
    <div class="govuk-task-list__status" id="company-details-5-status">
      <strong class="govuk-tag govuk-tag--blue">
        Incomplete
      </strong>
    </div>
  </li>
</ul>

### props
Along with the properties already defined in the config.json file, this React component should accept the following additional props

No additional props required

## Storybook support
configure the component for presentation in Storybook passing simulated details where required. Provide a description of available properties and how to configure in Pega.

Note, since there are two versions of the component required (custom-sdk and custom-constellation), there are two versions of Storybook.  This are launched through the following commands - storybookSDK and storybookConstellation

Helper utilities should be stored outside of specific component story files for global use.

## Unit tests
Add unit testing for the Jest framework

Tests can be executed with the test:functional script
