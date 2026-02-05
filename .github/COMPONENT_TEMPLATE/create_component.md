# Create a new custom DX component

## Summary

[Summary]

## Context
Component created through the npm run create command.  There are multiple types of component to choose from - details of the type and subtype for this component can be found below.

[https://docs.pega.com/bundle/platform/page/platform/user-experience/creating-custom-dx-components-con.html](Creating Constellation DX components - Pega Documentation)

"While the Constellation architecture has an extensive library of out-of-the-box assets, the framework provides tools for expanding the UI by adding Constellation digital experience (DX) components. This still-evolving framework helps early adopters build interfaces tailored to their specific business needs."


## Parameters
SDK design system: [Gov UK Frontend]
Component type: [Field / Layout Template / Widget]
Component subtype: []

## Functionality
[Functionality]

Ensure the code is correctly typed.
The constellation component should always use the Constellation design system
The custom component will use the specified design system.  Classes for this should be globally available in the build, so they don't need to be added for each individual component.

### props
Along with the properties already defined in the config.json file, this React component should accept the following additional props

[propName: type]
...

## Storybook support
configure the component for presentation in Storybook passing simulated details where required. Provide a description of available properties and how to configure in Pega.

Note, since there are two versions of the component required (custom-sdk and custom-constellation), there are two versions of Storybook.  This are launched through the following commands - storybookSDK and storybookConstellation

Helper utilities should be stored outside of specific component story files for global use.

## Unit tests
Add unit testing for the Jest framework

Tests can be executed with the test:functional script
