// Statically load all "local" components that aren't yet in the npm package
// import MediaCoTodo from '@pega/react-sdk-components/lib/mediaco/ToDo';

import TextInput from './src/components/override-sdk/field/TextInput/';
import Dropdown from './src/components/override-sdk/field/Dropdown/';
import RadioButtons from './src/components/override-sdk/field/RadioButtons/';
import ActionButtons from './src/components/override-sdk/infra/ActionButtons/';
/* import end - DO NOT REMOVE */

// localSdkComponentMap is the JSON object where we'll store the components that are
// found locally. If not found here, we'll look in the Pega-provided component map

const localSdkComponentMap = {
  // Todo: MediaCoTodo,
  TextInput: TextInput,
  Dropdown: Dropdown,
  RadioButtons: RadioButtons,
  ActionButtons: ActionButtons
  /* map end - DO NOT REMOVE */
};

export default localSdkComponentMap;
