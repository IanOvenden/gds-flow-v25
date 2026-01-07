interface ActionButtonsProps {
  arMainButtons?: any[];
  arSecondaryButtons?: any[];
  onButtonPress: any;
}

export default function ActionButtons(props: ActionButtonsProps) {
  const { arMainButtons = [], arSecondaryButtons = [], onButtonPress } = props;

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Assignment';

  const handleButtonPress = (action: string, type: string) => {
    onButtonPress(action, type);
  };

  if (arMainButtons.length === 0 && arSecondaryButtons.length === 0) {
    return null;
  }

  return (
    <div className='govuk-button-group'>
      {arMainButtons.map(button => (
        <button
          key={button.name}
          type='button'
          className='govuk-button'
          data-module='govuk-button'
          onClick={() => handleButtonPress(button.jsAction, 'primary')}
        >
          {localizedVal(button.name, localeCategory)}
        </button>
      ))}
      {arSecondaryButtons.map(button => (
        <button
          key={button.name}
          type='button'
          className='govuk-button govuk-button--secondary'
          data-module='govuk-button'
          onClick={() => handleButtonPress(button.jsAction, 'secondary')}
        >
          {localizedVal(button.name, localeCategory)}
        </button>
      ))}
    </div>
  );
}
