import type { Meta, StoryObj } from '@storybook/react';
import { Text, Grid, Card, CardContent, CardHeader, Input, FormControl, FormField } from '@pega/cosmos-react-core';
import { WorkTheme } from '@pega/cosmos-react-core';
import { GdsTaskForceGdsHierarchicalFormTaskList } from './index';
import React from 'react';
import { ThemeProvider } from 'styled-components';

const meta = {
  title: 'Templates/Hierarchical Form as Tasks',
  decorators: [
    Story => (
      <ThemeProvider theme={WorkTheme as any}>
        <Story />
      </ThemeProvider>
    )
  ],
  argTypes: {
    getPConnect: {
      table: {
        disable: true
      }
    }
  },
  component: GdsTaskForceGdsHierarchicalFormTaskList
} satisfies Meta<typeof GdsTaskForceGdsHierarchicalFormTaskList>;

export default meta;

type Story = StoryObj<typeof GdsTaskForceGdsHierarchicalFormTaskList>;
export const Default: Story = {
  render: args => {
    const props = {
      template: 'HierarchicalFormAsTasks',
      heading: args.heading,
      getPConnect: () => {
        return {
          getLocalizedValue: (val: string) => {
            return val;
          }
        };
      }
    };

    // Create a wrapper component that has the necessary structure
    interface ChildWrapperProps {
      getPConnect: () => {
        getChildren: () => Array<any>;
      };
    }

    const ChildComponentWrapper: React.FC<ChildWrapperProps> = () => {
      // This component provides the structure expected by the parent component
      return null; // The actual rendering is handled by the parent
    };

    // Mock the children components with the correct structure
    const generateView = (viewName: string) => ({
      getPConnect: () => ({
        getComponent: () => (
          <Card>
            <CardHeader>
              <Text variant='h2'>{viewName}</Text>
            </CardHeader>
            <CardContent>
              <Grid container={{ gap: 1, cols: `repeat(1, minmax(0, 1fr))` }} style={{ maxWidth: '80ch' }}>
                {[1, 2, 3].map(index => (
                  <FormField key={index} label={`${viewName}-Field${index}`}>
                    <FormControl ariaLabel={`${viewName}-Field${index}`}>
                      <Input />
                    </FormControl>
                  </FormField>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ),
        getConfigProps: () => ({
          name: viewName
        })
      })
    });

    const generateGroup = (groupNumber: number, viewCount: number) => ({
      getPConnect: () => ({
        getConfigProps: () => ({
          heading: `Group${groupNumber}`
        }),
        getChildren: () =>
          Array(viewCount)
            .fill(null)
            .map((_, i) => generateView(`View${groupNumber}-${i + 1}`))
      })
    });

    const generateChildren = (groupCount: number, viewsPerGroup: number) => [
      <ChildComponentWrapper
        key='1'
        getPConnect={() => ({
          getChildren: () =>
            Array(groupCount)
              .fill(null)
              .map((_, i) => generateGroup(i + 1, viewsPerGroup))
        })}
      />
    ];

    const children = generateChildren(args.numberOfGroups || 2, args.viewsPerGroup || 2);

    return (
      <Card>
        <CardContent>
          <GdsTaskForceGdsHierarchicalFormTaskList {...props}>{children}</GdsTaskForceGdsHierarchicalFormTaskList>
        </CardContent>
      </Card>
    );
  },
  args: {
    heading: 'Heading',
    numberOfGroups: 2,
    viewsPerGroup: 2
  }
};
