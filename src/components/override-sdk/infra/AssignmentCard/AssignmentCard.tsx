// @ts-nocheck
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { getComponentFromMap } from '@pega/react-sdk-components/lib/bridge/helpers/sdk_component_map';

export default function AssignmentCard(props) {
  // Get emitted components from map (so we can get any override that may exist)
  const ActionButtons = getComponentFromMap('ActionButtons');
  const { children, actionButtons, onButtonPress, getPConnect } = props;
  const [arMainButtons, setArMainButtons] = useState([]);
  const [arSecondaryButtons, setArSecondaryButtons] = useState([]);
  useEffect(() => {
    if (actionButtons) {
      setArMainButtons(actionButtons.main);
      setArSecondaryButtons(actionButtons.secondary);
    }
  }, [actionButtons]);
  function buttonPress(sAction, sType) {
    onButtonPress(sAction, sType);
  }
  return _jsxs(_Fragment, {
    children: [
      children,
      arMainButtons &&
        arSecondaryButtons &&
        _jsx(ActionButtons, { getPConnect, arMainButtons: arMainButtons, arSecondaryButtons: arSecondaryButtons, onButtonPress: buttonPress })
    ]
  });
}
//# sourceMappingURL=AssignmentCard.js.map
