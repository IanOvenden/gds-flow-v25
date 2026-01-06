import PegaAuthProvider from './context/PegaAuthProvider';
import { PegaReadyProvider } from './context/PegaReadyContext';

import MainScreen from './MainScreen';
import { theme } from '../../theme';
import './styles.css';

export default function Embedded() {
  return (
    <PegaAuthProvider>
      <PegaReadyProvider theme={theme}>
        <>
          <MainScreen />
        </>
      </PegaReadyProvider>
    </PegaAuthProvider>
  );
}
