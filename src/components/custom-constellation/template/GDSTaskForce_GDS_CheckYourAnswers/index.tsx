import { Grid, Flex, FieldGroup, withConfiguration } from '@pega/cosmos-react-core';


import type { PConnFieldProps } from './PConnProps';
import './create-nonce';
import DetailsRender from './DetailsRender';

import StyledGdsTaskForceGdsCheckYourAnswersWrapper from './styles';

// interface for props
interface GdsTaskForceGdsCheckYourAnswersProps extends PConnFieldProps {
  // If any, enter additional props that only exist on TextInput here
  showLabel: boolean;
  NumCols: string;
  children: any;
}

// props passed in combination of props from property panel (config.json) and run time props from Constellation
// any default values in config.pros should be set in defaultProps at bottom of this file
function GdsTaskForceGdsCheckYourAnswers(props: GdsTaskForceGdsCheckYourAnswersProps) {

  const { children = [], NumCols = '1', label, showLabel, getPConnect, readOnly, displayMode } = props;
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };

  const nCols = parseInt(NumCols, 10);


  if (readOnly && readOnly === true || displayMode && displayMode === 'DISPLAY_ONLY') {
    const numRegions = '1';
    const gridRepeat = 'repeat('.concat(numRegions).concat(', 1fr)');
    const gridContainer = { colGap: 0, 'margin-line-start': 0 };
    // @ts-ignore
    gridContainer.cols = gridRepeat;
    // @ts-ignore
    gridContainer.gap = 2;

    return (
      <StyledGdsTaskForceGdsCheckYourAnswersWrapper>
        <FieldGroup name={propsToUse.showLabel ? propsToUse.label : ''}>
          <Grid container={gridContainer} data-testid={`column-count-${numRegions}`}>
            {children.map((child: any, i: number) => (
              <Flex
                // @ts-ignore
                container={{ direction: 'column', alignItems: 'normal', colGap: 1, rowGap: 1.5 }}
                key={`r-${i + 1}`}
              >
                <DetailsRender child={child} />
              </Flex>
            ))}
          </Grid>
        </FieldGroup>
      </StyledGdsTaskForceGdsCheckYourAnswersWrapper>
    );
  }
  return (
    <StyledGdsTaskForceGdsCheckYourAnswersWrapper>
    <FieldGroup name={propsToUse.showLabel ? propsToUse.label : ''}>
      <Grid container={{
            cols: `repeat(${nCols}, minmax(0, 1fr))`,
            gap: 2
          }}>
            {children}
      </Grid>
    </FieldGroup>
    </StyledGdsTaskForceGdsCheckYourAnswersWrapper>
  );


}

export default withConfiguration(GdsTaskForceGdsCheckYourAnswers);
