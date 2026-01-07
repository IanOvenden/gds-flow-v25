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
    PCore.getMashupApi().createCase('OBMN01-GDSComp-Work-ComplaintCapture', PCore.getConstants().APP.APP, {});
    setShowLandingPage(false);
    setShowPega(true);
  };

  function renderLandingPage() {
    return (
      <div className='govuk-width-container'>
        <main role='main' id='content' className='govuk-main-wrapper  '>
          <span id='Top'></span>

          <div className='govuk-grid-row'>
            <div className='govuk-grid-column-two-thirds'>
              <div className='gem-c-heading govuk-!-margin-bottom-8'>
                <h1 className='gem-c-heading__text govuk-heading-xl'>Complain about HMRC</h1>
              </div>
            </div>
          </div>
          <div className='govuk-grid-row'>
            <div className='govuk-grid-column-two-thirds'>
              <div className='responsive-bottom-margin'>
                <div
                  data-module='govspeak'
                  className='gem-c-govspeak govuk-govspeak gem-c-govspeak--direction-ltr js-disable-youtube govuk-!-margin-bottom-0'
                  data-govspeak-module-started='true'
                >
                  <p>
                    Contact HM Revenue and Customs (<abbr title='HM Revenue and Customs'>HMRC</abbr>) as soon as possible if you have a complaint
                    about their service, for example because there were unreasonable delays.
                  </p>

                  <div role='note' aria-label='Information' className='application-notice info-notice'>
                    <p>
                      This guide is also available <a href='/cwyno-am-cthem'>in Welsh (Cymraeg)</a>.
                    </p>
                  </div>

                  <div role='note' aria-label='Warning' className='application-notice help-notice'>
                    <p>
                      You should continue to pay tax while your complaint is being dealt with. If you stop or delay your payments you may be charged
                      interest or penalties.
                    </p>
                  </div>

                  <h2 id='before-you-complain'>Before you complain</h2>

                  <p>
                    If you do not need to complain, there are other ways to{' '}
                    <a href='/contact-hmrc'>
                      contact <abbr title='HM Revenue and Customs'>HMRC</abbr>
                    </a>
                    . You can also{' '}
                    <a href='/guidance/check-when-you-can-expect-a-reply-from-hmrc'>
                      check when to expect a reply from <abbr title='HM Revenue and Customs'>HMRC</abbr>
                    </a>
                    .
                  </p>

                  <p>
                    If you’re an agent, use the <a href='/guidance/tax-agents-handbook/contacting-hmrc'>Tax agents handbook</a> to find information
                    about <abbr title='HM Revenue and Customs'>HMRC</abbr>’s Agent Account Managers service and dedicated helplines.
                  </p>

                  <p>
                    <abbr title='HM Revenue and Customs'>HMRC</abbr> cannot investigate complaints when:
                  </p>

                  <ul>
                    <li>
                      you disagree with a tax decision or a penalty -{' '}
                      <a href='/tax-appeals'>follow a different process to get a review of a decision</a>
                    </li>
                    <li>a complaint is currently being investigated by the Adjudicators Office or the Parliamentary and Health Service Ombudsman</li>
                  </ul>

                  <h3 id='if-youre-complaining-about-paye-or-self-assessment'>If you’re complaining about PAYE or Self Assessment</h3>

                  <p>
                    If you’re an individual you may be able to{' '}
                    <a rel='external' href='https://www.tax.service.gov.uk/ask-hmrc/webchat/paye-and-self-assessment-resolutions'>
                      use the webchat service
                    </a>{' '}
                    to resolve your issue before you make a formal complaint.
                  </p>

                  <h2 id='how-to-complain'>How to complain</h2>

                  <h3 id='complain-online'>Complain online</h3>

                  <p>
                    You’ll need to sign in to use this service. If you do not already have sign in details, you’ll be able to create them when you
                    sign in for the first time.
                  </p>

                  <p>
                    You’ll be told when you sign in if you need to prove your identity. This is to keep your details safe and usually involves using
                    photo ID like a passport or driving licence.
                  </p>

                  <p>You can:</p>

                  <ul>
                    <li>
                      <a rel='external' href='http://www.tax.service.gov.uk/digital-forms/form/make-a-complaint-online/draft/guide'>
                        complain if you’re an individual
                      </a>
                    </li>
                    <li>
                      <a rel='external' href='http://www.tax.service.gov.uk/digital-forms/form/make-a-business-complaint-online/draft/guide'>
                        complain online if you’re a business
                      </a>
                    </li>
                    <li>
                      <a rel='external' href='https://www.tax.service.gov.uk/submissions/new-form/complain-about-hmrc-as-agent'>
                        complain online if you’re an agent
                      </a>{' '}
                      (you must have{' '}
                      <a href='/guidance/how-to-get-authorised-to-act-as-a-tax-agent-on-behalf-of-your-clients'>permission from your client</a> to do
                      this)
                    </li>
                  </ul>

                  <h3 id='complain-by-phone-or-post'>Complain by phone or post</h3>

                  <p>
                    You can also{' '}
                    <a href='https://www.gov.uk/government/organisations/hm-revenue-customs/contact/complain-about-hmrc'>complain by phone or post</a>
                    . You’ll need:
                  </p>

                  <ul>
                    <li>your National Insurance number, Unique Taxpayer Reference (UTR) or VAT number</li>
                    <li>your full name, address, phone number and email address</li>
                    <li>details of what happened and when</li>
                    <li>to say how you’d like your complaint resolved</li>
                  </ul>

                  <h2 id='if-you-need-extra-support-with-your-complaint'>If you need extra support with your complaint</h2>

                  <p>
                    Tell <abbr title='HM Revenue and Customs'>HMRC</abbr> when you complain if you need extra support with your complaint because of a
                    health condition or your personal circumstances.
                  </p>

                  <h3 id='if-you-need-someone-to-complain-on-your-behalf'>If you need someone to complain on your behalf</h3>

                  <p>
                    You can ask someone else to complain for you. You’ll need to{' '}
                    <a href='https://www.gov.uk/appoint-tax-agent'>
                      authorise them to deal with <abbr title='HM Revenue and Customs'>HMRC</abbr> on your behalf
                    </a>{' '}
                    before they can make a complaint for you.
                  </p>

                  <h2 id='what-happens-when-you-complain-to-hmrc'>
                    What happens when you complain to <abbr title='HM Revenue and Customs'>HMRC</abbr>
                  </h2>

                  <p>
                    <abbr title='HM Revenue and Customs'>HMRC</abbr> will review your complaint. They will investigate what happened and what should
                    have happened. This is called a ‘first tier’ review.
                  </p>

                  <p>
                    Normally, <abbr title='HM Revenue and Customs'>HMRC</abbr> will contact you within 6 weeks of receiving your complaint. They will
                    tell you the outcome of the first tier review and what the next step is.
                  </p>

                  <div role='note' aria-label='Information' className='application-notice info-notice'>
                    <p>
                      <abbr title='HM Revenue and Customs'>HMRC</abbr> will not treat you differently to anyone else because you’ve made a complaint.
                      They will handle your complaint fairly, confidentially and investigate the issues thoroughly.
                    </p>
                  </div>

                  <p>
                    <abbr title='HM Revenue and Customs'>HMRC</abbr> will consider refunding any reasonable costs directly caused by their mistakes or
                    delays. Costs can include:
                  </p>

                  <ul>
                    <li>postage</li>
                    <li>phone charges</li>
                    <li>professional fees</li>
                  </ul>

                  <p>Keep your receipts if you want a refund.</p>

                  <h3 id='if-you-disagree-with-the-outcome-of-the-first-tier-review'>If you disagree with the outcome of the first tier review</h3>

                  <p>You can ask for your complaint to be reviewed a second time. This is called a ‘second tier’ review.&nbsp;</p>

                  <p>You can either do this online or by post using the address provided during the first tier review.</p>

                  <p>
                    A different person will review your complaint, look at how your complaint was handled at the first tier review and let you know
                    the outcome.
                  </p>

                  <p>
                    The decision from the second tier review is final. You will not be able to ask <abbr title='HM Revenue and Customs'>HMRC</abbr>{' '}
                    for another review.
                  </p>

                  <h3 id='if-you-disagree-with-the-outcome-of-the-second-tier-review'>If you disagree with the outcome of the second tier review</h3>

                  <p>
                    You can{' '}
                    <a href='/guidance/how-to-complain-to-the-adjudicators-office-about-hmrc-or-the-voa'>
                      ask the Adjudicator’s Office to review your complaint
                    </a>
                    . <abbr title='HM Revenue and Customs'>HMRC</abbr> will tell you how to do this.
                  </p>

                  <p>
                    This service is free and independent of <abbr title='HM Revenue and Customs'>HMRC</abbr>.
                  </p>

                  <div role='note' aria-label='Information' className='application-notice info-notice'>
                    <p>
                      You can only ask the Adjudicator’s Office to look at your complaint if you’ve had a first and second tier review from{' '}
                      <abbr title='HM Revenue and Customs'>HMRC</abbr>.
                    </p>
                  </div>

                  <h3 id='if-you-disagree-with-the-adjudicators-office'>If you disagree with the Adjudicator’s Office</h3>

                  <p>
                    You can{' '}
                    <a rel='external' href='https://www.parliament.uk/mps-lords-and-offices/mps/'>
                      ask your MP
                    </a>{' '}
                    to refer your complaint to the{' '}
                    <a rel='external' href='https://ombudsman.org.uk/'>
                      Parliamentary and Health Service Ombudsman
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className='govuk-grid-column-one-third sidebar-navigation'>
              <div className='gem-c-contextual-sidebar govuk-!-display-none-print'>
                <div
                  data-module='ga4-link-tracker'
                  className='gem-c-related-navigation govuk-!-display-none-print'
                  data-ga4-link-tracker-module-started='true'
                >
                  <h2 id='related-nav-related_items-ad494188' className='gem-c-related-navigation__main-heading'>
                    Related content
                  </h2>

                  <nav
                    className='gem-c-related-navigation__nav-section'
                    aria-labelledby='related-nav-related_items-ad494188'
                    data-module='gem-toggle'
                    data-gem-toggle-module-started='true'
                  >
                    <ul className='gem-c-related-navigation__link-list'>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"1","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/tax-appeals'
                        >
                          Disagree with a tax decision or penalty
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"2","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/guidance/complain-about-serious-misconduct-by-hm-revenue-and-customs-staff'
                        >
                          Complain about serious misconduct by HMRC staff
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"3","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/tax-tribunal'
                        >
                          Appeal to the tax tribunal
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"4","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/guidance/tax-disputes-alternative-dispute-resolution-adr'
                        >
                          Use alternative dispute resolution to settle a tax dispute
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"5","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/government/publications/hmrc-charter'
                        >
                          HMRC Charter
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar govuk-link gem-c-related-navigation__section-link--inline  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"6","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/government/collections/paying-hmrc-detailed-information'
                        >
                          Paying HMRC: detailed information
                        </a>
                      </li>
                    </ul>
                  </nav>

                  <nav
                    className='gem-c-related-navigation__nav-section'
                    aria-labelledby='related-nav-collections-ad494188'
                    data-module='gem-toggle'
                    data-gem-toggle-module-started='true'
                  >
                    <h3
                      id='related-nav-collections-ad494188'
                      className='gem-c-related-navigation__sub-heading gem-c-related-navigation__sub-heading--sidebar'
                      data-track-count='sidebarRelatedItemSection'
                    >
                      Collection
                    </h3>

                    <ul className='gem-c-related-navigation__link-list'>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"2","index_link":"1","index_section_count":"2","index_total":"1","section":"Collection"}'
                          href='/government/collections/hmrc-complaints-and-appeals-detailed-information'
                        >
                          HMRC complaints and appeals: detailed information
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          <div className='govuk-grid-row'>
            <div className='govuk-grid-column-two-thirds'>
              <div className='gem-c-contextual-footer govuk-!-display-none-print' dir='ltr'>
                <div
                  data-module='ga4-link-tracker'
                  className='gem-c-related-navigation govuk-!-display-none-print'
                  data-ga4-link-tracker-module-started='true'
                >
                  <nav
                    className='gem-c-related-navigation__nav-section'
                    aria-labelledby='related-nav-topics-531ac08e'
                    data-module='gem-toggle'
                    data-gem-toggle-module-started='true'
                  >
                    <h2
                      id='related-nav-topics-531ac08e'
                      className='gem-c-related-navigation__sub-heading gem-c-related-navigation__sub-heading--footer'
                      data-track-count='footerRelatedItemSection'
                    >
                      Explore the topic
                    </h2>

                    <ul className='gem-c-related-navigation__link-list'>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--footer'
                          data-ga4-link='{"event_name":"navigation","type":"contextual footer","index_section":"1","index_link":"1","index_section_count":"2","index_total":"1","section":"Explore the topic"}'
                          href='/browse/tax/dealing-with-hmrc'
                        >
                          Dealing with HMRC
                        </a>
                      </li>
                    </ul>
                  </nav>

                  <nav
                    className='gem-c-related-navigation__nav-section'
                    aria-labelledby='related-nav-related_external_links-531ac08e'
                    data-module='gem-toggle'
                    data-gem-toggle-module-started='true'
                  >
                    <h2
                      id='related-nav-related_external_links-531ac08e'
                      className='gem-c-related-navigation__sub-heading gem-c-related-navigation__sub-heading--footer  gem-c-related-navigation__sub-heading--other'
                      data-track-count='footerRelatedItemSection'
                    >
                      Elsewhere on the web
                    </h2>

                    <ul className='gem-c-related-navigation__link-list'>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--footer  govuk-link gem-c-related-navigation__section-link--other'
                          rel='external'
                          data-ga4-link='{"event_name":"navigation","type":"contextual footer","index_section":"2","index_link":"1","index_section_count":"2","index_total":"4","section":"Elsewhere on the web"}'
                          href='https://www.gov.uk/dealing-hmrc-additional-needs'
                        >
                          Dealing with HMRC if you have additional needs
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--footer  govuk-link gem-c-related-navigation__section-link--other'
                          rel='external'
                          data-ga4-link='{"event_name":"navigation","type":"contextual footer","index_section":"2","index_link":"2","index_section_count":"2","index_total":"4","section":"Elsewhere on the web"}'
                          href='https://www.citizensadvice.org.uk/'
                        >
                          Citizens Advice
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--footer  govuk-link gem-c-related-navigation__section-link--other'
                          rel='external'
                          data-ga4-link='{"event_name":"navigation","type":"contextual footer","index_section":"2","index_link":"3","index_section_count":"2","index_total":"4","section":"Elsewhere on the web"}'
                          href='http://taxaid.org.uk/'
                        >
                          TaxAid
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--footer  govuk-link gem-c-related-navigation__section-link--other'
                          rel='external'
                          data-ga4-link='{"event_name":"navigation","type":"contextual footer","index_section":"2","index_link":"4","index_section_count":"2","index_total":"4","section":"Elsewhere on the web"}'
                          href='http://www.taxvol.org.uk/'
                        >
                          Tax help for older people
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </main>
        <button type='submit' className='govuk-button' data-module='govuk-button' onClick={createComplaintCase} style={{ marginBottom: '2rem' }}>
          Make a complaint
        </button>
      </div>
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
