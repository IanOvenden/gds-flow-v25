import styled, { css } from 'styled-components';

export default styled.div(() => {
  return css`
    margin: 0;

    /* Ensure GDS styles are applied properly */
    .govuk-task-list {
      margin-bottom: 1.5rem;
    }
  `;
});
