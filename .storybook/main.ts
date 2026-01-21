import path from 'path';

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: process.env.STORYBOOK_CONSTELLATION
    ? ['../src/components/custom-constellation/**/*.stories.@(js|jsx|ts|tsx)']
    : ['../src/components/custom-sdk/**/*.stories.@(js|jsx|ts|tsx)'],

  typescript: {
    reactDocgen: 'react-docgen-typescript'
  },

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    {
      name: '@storybook/addon-docs',
      options: { mdxBabelOptions: { babelrc: true, configFile: true } }
    }
  ],
  framework: '@storybook/react-webpack5',

  webpackFinal: async config => {
    if (config.resolve?.alias) {
      config.resolve.alias['@pega/react-sdk-components/lib/bridge/react_pconnect'] = path.resolve(__dirname, '../__mocks__/react_pconnect.jsx');
      config.resolve.alias['@pega/react-sdk-components/lib/components/designSystemExtension/DetailsFields'] = path.resolve(
        __dirname,
        '../__mocks__/DetailsFields.js'
      );
      config.resolve.alias['@pega/react-sdk-components/lib/components/helpers/state-utils'] = path.resolve(__dirname, '../__mocks__/state-utils.tsx');
      config.resolve.alias['@pega/auth/lib/sdk-auth-manager'] = path.resolve(__dirname, '../__mocks__/authManager.tsx');
    }

    // Remove the existing CSS rules from Storybook that are conflicting
    if (config.module?.rules) {
      config.module.rules = config.module.rules.filter((rule: any) => {
        // Keep non-CSS rules
        if (!rule || typeof rule !== 'object') return true;
        if (!rule.test) return true;
        // Remove existing CSS rules to prevent double-loading
        const testString = rule.test.toString();
        if (testString.includes('\\.css')) return false;
        return true;
      });

      // Add our custom rules
      config.module.rules.push(
        {
          test: /\.(d.ts)$/,
          loader: 'null-loader'
        },
        {
          test: /\.(map)$/,
          loader: 'null-loader'
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  quietDeps: true, // Suppress deprecation warnings from dependencies
                  silenceDeprecations: ['mixed-decls', 'import', 'global-builtin', 'color-functions', 'slash-div', 'if-function']
                }
              }
            }
          ]
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        }
      );
    }

    return config;
  }
};

export default config;
