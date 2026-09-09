export default function ResolutionScreen() {
  const primaryContainer = PCore.getContainerUtils().getActiveContainerItemName('app/primary') || 'app/primary_1';
  const workareaContainer = PCore.getContainerUtils().getActiveContainerItemName(primaryContainer + '/workarea') || 'app/primary_1/workarea_1';

  const getValue = (fieldName: string) => PCore.getStoreValue(fieldName, 'caseInfo.content', workareaContainer);

  const complaintReference = getValue('.pyID') || getValue('.pyCaseID') || 'Reference unavailable';
  const contactEmail = getValue('.CustomerProfile.EmailAddress') || getValue('.EmailAddress') || 'your email address';
  const contactName =
    getValue('.CustomerProfile.FullName') ||
    [getValue('.CustomerProfile.FirstName'), getValue('.CustomerProfile.LastName')].filter(Boolean).join(' ') ||
    'the details you provided';

  return (
    <div className='govuk-width-container'>
      <main className='govuk-main-wrapper' id='complaint-submitted' role='main'>
        <div className='govuk-grid-row'>
          <div className='govuk-grid-column-two-thirds'>
            <div className='govuk-panel govuk-panel--confirmation govuk-!-margin-bottom-8'>
              <h1 className='govuk-panel__title'>Complaint submitted</h1>
              <div className='govuk-panel__body'>
                Your reference number
                <br />
                <strong>{complaintReference}</strong>
              </div>
            </div>

            <p className='govuk-body'>
              We have received your complaint about HMRC and sent a confirmation using {contactName} and {contactEmail}.
            </p>

            <h2 className='govuk-heading-m'>What happens next</h2>
            <p className='govuk-body'>HMRC will review what happened and what should have happened as part of a first tier review.</p>
            <p className='govuk-body'>You will normally be contacted within 6 weeks with the outcome and any next steps.</p>

            <div className='govuk-inset-text'>
              Keep your complaint reference safe. You may need it if you contact HMRC again about this submission.
            </div>

            <dl className='govuk-summary-list govuk-!-margin-bottom-8'>
              <div className='govuk-summary-list__row'>
                <dt className='govuk-summary-list__key'>Complaint reference</dt>
                <dd className='govuk-summary-list__value'>{complaintReference}</dd>
              </div>
              <div className='govuk-summary-list__row'>
                <dt className='govuk-summary-list__key'>Confirmation sent to</dt>
                <dd className='govuk-summary-list__value'>{contactEmail}</dd>
              </div>
              <div className='govuk-summary-list__row'>
                <dt className='govuk-summary-list__key'>Expected response time</dt>
                <dd className='govuk-summary-list__value'>Usually within 6 weeks</dd>
              </div>
            </dl>

            <a href='/' role='button' draggable='false' className='govuk-button' data-module='govuk-button'>
              Return to the service start
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
