import { Preview, Decorator } from '@storybook/react';
import { Configuration, PopoverManager, Toaster, ModalManager, WorkTheme } from '@pega/cosmos-react-core';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { CssBaseline } from '@mui/material';
import { getSdkComponentMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';
import { theme } from '../src/theme';

import sdkConfig from '../sdk-config.json';
import { themes as sbThemes } from '@storybook/theming';

import { decorator } from '../__mocks__/react_pconnect';
import setPCoreMocks from '../__mocks__/pcoreMocks';

// Import GDS styles globally for all Storybook stories
import '../assets/css/gdsStyles.scss';

const isConstellation = process.env.STORYBOOK_CONSTELLATION;

if (!isConstellation) {
  getSdkComponentMap();
}

setPCoreMocks();

const isDark = String(sdkConfig?.theme).toLowerCase() === 'dark';

const CANVAS_COLOR = (theme as any).backgroundColor || (isDark ? '#060326' : 'whitesmoke');

const decorators: Decorator[] = [
  (Story, context) => {
    return isConstellation ? (
      <Configuration>
        <PopoverManager>
          <Toaster dismissAfter={5000}>
            <ModalManager>
              <StyledThemeProvider theme={theme as any}>
                <Story {...context} />
              </StyledThemeProvider>
            </ModalManager>
          </Toaster>
        </PopoverManager>
      </Configuration>
    ) : (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <StyledThemeProvider theme={theme as any}>
            <CssBaseline />
            <Story {...context} />
          </StyledThemeProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    );
  },
  decorator
];

// 3) Set canvas and Docs chrome
const parameters: Preview['parameters'] = {
  backgrounds: {
    default: 'App',
    values: [{ name: 'App', value: isConstellation ? '' : CANVAS_COLOR }]
  },
  docs: {
    theme: isDark ? sbThemes.dark : sbThemes.light,
    source: { type: 'code' },
    codePanel: true
  }
};

const preview: Preview = {
  decorators,
  parameters
};

export default preview;
