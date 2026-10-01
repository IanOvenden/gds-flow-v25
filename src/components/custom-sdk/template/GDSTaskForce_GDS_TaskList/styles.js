import styled, { css } from 'styled-components';

export default styled.div(() => {
  return css`
    margin: 0;

    /* Ensure GDS styles are applied properly */
    .govuk-task-list {
      margin-bottom: 1.5rem;
    }

    .govuk-task-list__status {
      .govuk-task-list__status-label {
        box-sizing: border-box;
        display: inline-block;
        width: 9rem;
        text-align: center;
        white-space: nowrap;
      }
    }
  `;
});
