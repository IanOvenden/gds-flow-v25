import { useEffect, useState } from 'react';

import { usePegaAuth } from '../context/PegaAuthProvider';
import { usePega } from '../context/PegaReadyContext';

import ResolutionScreen from '../ResolutionScreen';

export default function MainScreen() {
  const { isAuthenticated } = usePegaAuth();
  const { isPegaReady, PegaContainer } = usePega();

  const [showPega, setShowPega] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showResolution, setShowResolution] = useState(false);

  useEffect(() => {
    if (isPegaReady) {
      // Subscribe to the EVENT_CANCEL event to handle the assignment cancellation
      PCore.getPubSubUtils().subscribe(PCore.getConstants().PUB_SUB_EVENTS.EVENT_CANCEL, () => cancelAssignment(), 'cancelAssignment');

      // Subscribe to the END_OF_ASSIGNMENT_PROCESSING event to handle assignment completion
      PCore.getPubSubUtils().subscribe(
        PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.END_OF_ASSIGNMENT_PROCESSING,
        () => assignmentFinished(),
        'endOfAssignmentProcessing'
      );
    }

    return () => {
      // unsubscribe to the events
      PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.EVENT_CANCEL, 'cancelAssignment');
      PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.END_OF_ASSIGNMENT_PROCESSING, 'endOfAssignmentProcessing');
    };
  }, [isPegaReady]);

  const cancelAssignment = () => {
    setShowLandingPage(true);
    setShowPega(false);
  };

  const assignmentFinished = () => {
    setShowResolution(true);
    setShowPega(false);
  };

  const createComplaintCase = async () => {
    PCore.getMashupApi().createCase('GDS-Complaint-Work-ComplaintCapture', PCore.getConstants().APP.APP, {});
    setShowLandingPage(false);
    setShowPega(true);
  };

  function renderLandingPage() {
    return (
      <div className='govuk-width-container'>
        <button onClick={createComplaintCase} style={{ marginBottom: '2rem' }}>
          Create Case
        </button>
      </div>
      // <div className={classes.mainContentArea}>
      //   <main className={classes.mainContainer}>
      //     <button onClick={createComplaintCase} style={{ marginBottom: '2rem' }}>
      //       Create Case
      //     </button>
      //     <section className={classes.hero}>

      //       <div className={classes.heroText}>
      //         <h1>
      //           Keeping you connected
      //           <br />
      //           to what matters.
      //         </h1>
      //       </div>
      //       <div className={classes.heroImage}>
      //         <img src='./assets/img/SDKDevicesImage.png' alt='Smartphone, Tablet, and Laptop' />
      //       </div>
      //     </section>
      //     <section className={classes.plansSection}>
      //       <div className={classes.plansIntro}>
      //         <h2>
      //           {}
      //           The phones you want at prices you'll <span className={classes.highlight}>love.</span>
      //         </h2>
      //       </div>
      //       <div className={classes.plansContainer}>
      //         {shoppingOptions.map(option => (
      //           <ShoppingOptionCard key={option.level} {...option} onClick={() => onShopNow(option.name)} />
      //         ))}
      //       </div>
      //     </section>
      //   </main>
      // </div>
    );
  }

  function renderPegaView() {
    return (
      <div>
        <div id='pega-part-of-page'>
          <PegaContainer />
          <br />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <div style={{ textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {showLandingPage && renderLandingPage()}
      {showResolution && <ResolutionScreen />}
      {showPega && renderPegaView()}
    </div>
  );
}
