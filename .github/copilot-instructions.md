# React SDK for Pega Infinity - Copilot Instructions

## Project Overview

This is a customized Pega **React SDK v25.1.10** that integrates the **UK Government Design System (GDS)** instead of the default Material UI. The SDK connects to Pega Infinity server (25+) via Constellation DX APIs to render case management UIs using custom DX Components.

**Key Customization**: All standard Material UI components have been replaced/overridden with GDS-compliant components using the `govuk-frontend` package (v5.13.0).

## Architecture

### Component Organization (Critical Pattern)

The SDK uses a **three-tier component structure** in [src/components/](src/components/):

1. **`custom-sdk/`** - Custom components used in the runtime React application (Material UI → GDS)
2. **`custom-constellation/`** - Constellation-compatible preview versions shown in Pega App Studio authoring
3. **`override-sdk/`** - Overrides of default Pega SDK components (e.g., Dropdown, TextInput) with GDS equivalents

**Why this matters**: When creating/modifying components, you typically create BOTH a `custom-sdk` version (runtime) AND a `custom-constellation` version (preview). The constellation version uses Pega's `@pega/cosmos-react-core` components to display in App Studio.

### Component Mapping System

Components are registered in [src/components_map.js](src/components_map.js) using lazy-loaded modules:
```javascript
export default {
  ComponentName: {
    modules: [loadable(() => import('./components/...'))]
  }
}
```

The DXCB (DX Component Builder) generates [sdk-local-component-map.js](sdk-local-component-map.js) which maps component names to their implementations.

### Application Entry Points

- [src/index.tsx](src/index.tsx) - Root application, renders `<TopLevelApp>`
- [src/samples/](src/samples/) contains three app modes:
  - **Embedded** - Mashup mode for embedded case creation
  - **FullPortal** - Complete portal experience
  - **TopLevelApp** - Router that selects appropriate mode

### Configuration

- [sdk-config.json](sdk-config.json) - Server URLs, OAuth client IDs, app alias, case types, DXCB publishing settings
- [dxcb.config.json](src/dxcb.config.json) - Identifies SDK type (`SDK-React`)

## DX Component Builder (DXCB) Workflow

### Creating Custom Components

**Command**: `npm run create`

This launches an interactive wizard that:
1. Prompts for component metadata (organization, library, type, subtype, name)
2. Generates scaffolding in `src/components/custom-sdk/` and `src/components/custom-constellation/`
3. Creates TypeScript files with PConnect integration
4. Adds Storybook stories for development

**Default metadata** from [sdk-config.json](sdk-config.json):
- Organization: `GDSTaskForce`
- Library: `GDS`
- Version: `0.0.1`

### Overriding Existing Components

**Command**: `npm run override`

Generates code in `src/components/override-sdk/` to replace default SDK component implementations. See [src/components/override-sdk/field/Dropdown/](src/components/override-sdk/field/Dropdown/) for example of Material UI → GDS conversion.

### Publishing to Pega

1. **Authenticate**: `npm run authenticate` - OAuth flow to get access token
2. **Build**: `npm run buildComponent` or `npm run buildAllComponents`
3. **Map**: `npm run mapAll` - Register components in Pega
4. **Publish**: `npm run publish` or `npm run publishAll` - Upload to configured ruleset (default: `CustomDXComponents:01-01-01`)

## Development Workflows

### Local Development

```bash
npm run build:dev:ci      # Clean install + dev build
npm run start-dev         # Webpack dev server on port 3502
npm run storybookSDK      # Storybook for SDK components (port 6040)
npm run storybookConstellation  # Constellation preview (port 6050)
```

**Important**: Run `npm run govuk-frontend-init` before first dev server start to copy GDS assets (fonts, images).

### Testing

- **E2E Tests**: `npm run test` - Playwright tests for MediaCo sample app
- **Functional Tests**: `npm run test:functional` - Jest tests for DXCB
- No automated unit tests for components (requires live Pega server interaction)

### GDS Styling

- [assets/css/gdsStyles.scss](assets/css/gdsStyles.scss) imports all GDS styles
- GDS components expect class names like `govuk-input`, `govuk-select--error`, `govuk-task-list`
- See [src/components/custom-constellation/template/GDSTaskForce_GDS_HierarchicalFormTaskList/](src/components/custom-constellation/template/GDSTaskForce_GDS_HierarchicalFormTaskList/) for complex GDS pattern implementation (Task List)

## PConnect Pattern (Critical)

All DX components receive a `getPConnect` prop that returns a `PConnect` object. This is the bridge to Pega's data and APIs:

```typescript
interface PConnProps {
  getPConnect: () => PConnect;
}

// Common usages:
getPConnect().getValue('.FieldName')           // Get field value
getPConnect().getActionsApi().updateFieldValue()  // Update field
getPConnect().getChildren()                     // Get child components
getPConnect().getConfigProps()                  // Get config from property panel
getPConnect().getLocalizedValue(key)           // Get i18n string
getPConnect().getContextName()                 // Get case context
```

**Type definitions**: Import from `@pega/pcore-pconnect-typedefs` for TypeScript support.

## Common Pitfalls

1. **Component not appearing**: Check [src/components_map.js](src/components_map.js) registration AND run `npm run mapAll` to sync with Pega
2. **Styling broken**: Ensure `govuk-frontend` assets are copied via `npm run govuk-frontend-init`
3. **TypeScript errors**: PConnect typedefs are in `@pega/pcore-pconnect-typedefs` - import `PConnect` from there
4. **Build fails**: Node 24.4.1 and npm 11.4.2 required (see [scripts/check-node-version.js](scripts/check-node-version.js))
5. **Authentication fails**: Verify `sdk-config.json` has correct `infinityRestServerUrl`, `portalClientId`, and OAuth registration exists in Pega

## File Naming Conventions

- Component files: `ComponentName/index.tsx` (PascalCase)
- Styles: `styles.ts` (styled-components) or `ComponentName.css`
- Stories: `demo.stories.tsx` for Storybook
- Types: `types.ts` or `PConnProps.d.ts` for TypeScript definitions
- Mocks: `mock.ts` for test data

## Key Dependencies

- **@pega/react-sdk-components** (25.1.10) - Base SDK component library
- **@pega/cosmos-react-core** (8.4.1) - Constellation design system (used in `-constellation` preview components)
- **govuk-frontend** (5.13.0) - UK Government Design System
- **@pega/dx-component-builder-sdk** - CLI for component lifecycle management
- **styled-components** (6.1.8) - CSS-in-JS for component styling

## Special Cases

### Task List Component Example

See [src/components/custom-constellation/template/GDSTaskForce_GDS_HierarchicalFormTaskList/](src/components/custom-constellation/template/GDSTaskForce_GDS_HierarchicalFormTaskList/) for a full implementation of a complex GDS pattern that:
- Parses hierarchical form data from PConnect children
- Maintains task state (Completed, Not yet started, etc.)
- Uses GDS task list markup with proper ARIA attributes
- Integrates with Pega assignment submission APIs

This demonstrates the full pattern: data extraction → state management → GDS markup → Pega API integration.

## Resources

- [Pega Constellation SDK Docs](https://docs.pega.com/bundle/constellation-sdk/page/constellation-sdks/sdks/constellation-sdks.html)
- [GDS Components](https://design-system.service.gov.uk/components/)
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Contribution guidelines
- [Implementation Notes.md](docs/Implementation%20Notes.md) - Additional technical details
