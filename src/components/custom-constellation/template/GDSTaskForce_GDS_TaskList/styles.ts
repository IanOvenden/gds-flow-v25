// individual style, comment out above, and uncomment here and add styles
import styled, { css } from 'styled-components';

export default styled.div(() => {
  return css`
    margin: 0px 0;

    /* Make SummaryList items with onClick handlers clickable */
    li[data-testid*='summary-item'] {
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      &:active {
        background-color: rgba(0, 0, 0, 0.08);
      }
    }

    /* Ensure text doesn't get selected when clicking */
    li[data-testid*='summary-item'] * {
      user-select: none;
    }
  `;
});
