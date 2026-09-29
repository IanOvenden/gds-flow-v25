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

  const createPoultryCase = async () => {
    PCore.getMashupApi().createCase('OBMN01-PoultryM-Work-ApplicationIntake', PCore.getConstants().APP.APP, {});
    setShowLandingPage(false);
    setShowPega(true);
  };

  const createNotifyAvianDiseaseCase = async () => {
    PCore.getMashupApi().createCase('OBMN01-PoultryM-Work-DiseaseNotification', PCore.getConstants().APP.APP, {});
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
                <h1 className='gem-c-heading__text govuk-heading-xl'>Register your poultry with HMRC</h1>
              </div>
            </div>
          </div>
          <div className='govuk-grid-row'>
            <div className='govuk-grid-column-two-thirds'>
              <div className='responsive-bottom-margin'>
                <button
                  type='submit'
                  className='govuk-button'
                  data-module='govuk-button'
                  onClick={createPoultryCase}
                  style={{ marginBottom: '2rem' }}
                >
                  Register poultry
                </button>

                <h2 className='govuk-heading-m' id='notify-avian-disease'>
                  Notify avian disease
                </h2>
                <button
                  type='submit'
                  className='govuk-button govuk-button--secondary'
                  data-module='govuk-button'
                  onClick={createNotifyAvianDiseaseCase}
                  style={{ marginBottom: '2rem' }}
                >
                  Notify avian disease
                </button>
                <div
                  data-module='govspeak'
                  className='gem-c-govspeak govuk-govspeak gem-c-govspeak--direction-ltr js-disable-youtube govuk-!-margin-bottom-0'
                  data-govspeak-module-started='true'
                >
                  <p>
                    Register with HM Revenue and Customs (<abbr title='HM Revenue and Customs'>HMRC</abbr>) as soon as possible if you keep poultry or
                    other captive birds, for example chickens, ducks, geese or birds of prey.
                  </p>

                  <div role='note' aria-label='Information' className='application-notice info-notice'>
                    <p>
                      This guide is also available{' '}
                      <a className='govuk-link' href='/cofrestru-dofednod'>
                        in Welsh (Cymraeg)
                      </a>
                      .
                    </p>
                  </div>

                  <div role='note' aria-label='Warning' className='application-notice help-notice'>
                    <p>
                      You must register your birds even if you only keep them as pets. If you do not register, or you do not keep your registration up
                      to date, you may be fined.
                    </p>
                  </div>

                  <h2 id='before-you-register'>Before you register</h2>

                  <p>
                    If you do not need to register, there are other ways to{' '}
                    <a className='govuk-link' href='/contact-hmrc'>
                      contact <abbr title='HM Revenue and Customs'>HMRC</abbr>
                    </a>
                    . You can also{' '}
                    <a className='govuk-link' href='/guidance/check-when-you-can-expect-a-reply-from-hmrc'>
                      check when to expect a reply from <abbr title='HM Revenue and Customs'>HMRC</abbr>
                    </a>
                    .
                  </p>

                  <p>
                    If you’re an agent, use the{' '}
                    <a className='govuk-link' href='/guidance/agents-handbook/contacting-hmrc'>
                      Agents handbook
                    </a>{' '}
                    to find information about <abbr title='HM Revenue and Customs'>HMRC</abbr>’s Agent Account Managers service and dedicated
                    helplines.
                  </p>

                  <p>
                    <abbr title='HM Revenue and Customs'>HMRC</abbr> cannot process your registration when:
                  </p>

                  <ul>
                    <li>
                      you do not have a county parish holding (CPH) number for the land where the birds are kept -{' '}
                      <a className='govuk-link' href='/guidance/apply-for-a-county-parish-holding-cph-number'>
                        apply for a CPH number first
                      </a>
                    </li>
                    <li>the premises where the birds are kept is currently under investigation for a suspected or confirmed disease outbreak</li>
                  </ul>

                  <h3 id='if-youre-registering-50-or-more-birds'>If you’re registering 50 or more birds</h3>

                  <p>
                    If you keep a commercial flock you may be able to{' '}
                    <a className='govuk-link' rel='external' href='https://www.tax.service.gov.uk/ask-hmrc/webchat/poultry-registration'>
                      use the webchat service
                    </a>{' '}
                    to check what you need before you register your flock.
                  </p>

                  <h2 id='how-to-register'>How to register</h2>

                  <h3 id='register-online'>Register online</h3>

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
                      <a
                        className='govuk-link'
                        rel='external'
                        href='http://www.tax.service.gov.uk/digital-forms/form/register-poultry-online/draft/guide'
                      >
                        register if you’re an individual keeper
                      </a>
                    </li>
                    <li>
                      <a
                        className='govuk-link'
                        rel='external'
                        href='http://www.tax.service.gov.uk/digital-forms/form/register-business-poultry-online/draft/guide'
                      >
                        register online if you’re a business
                      </a>
                    </li>
                    <li>
                      <a className='govuk-link' rel='external' href='https://www.tax.service.gov.uk/submissions/new-form/register-poultry-as-agent'>
                        register online if you’re an agent
                      </a>{' '}
                      (you must have{' '}
                      <a className='govuk-link' href='/guidance/how-to-get-authorised-to-act-as-an-agent-on-behalf-of-your-clients'>
                        permission from your client
                      </a>{' '}
                      to do this)
                    </li>
                  </ul>

                  <h3 id='register-by-phone-or-post'>Register by phone or post</h3>

                  <p>
                    You can also{' '}
                    <a className='govuk-link' href='https://www.gov.uk/government/organisations/hm-revenue-customs/contact/register-poultry'>
                      register by phone or post
                    </a>
                    . You’ll need:
                  </p>

                  <ul>
                    <li>your county parish holding (CPH) number, National Insurance number or VAT number</li>
                    <li>your full name, address, phone number and email address</li>
                    <li>details of the species you keep, how many birds you have and where they are kept</li>
                    <li>to say why you keep the birds, for example for eggs, meat or as pets</li>
                  </ul>

                  <h2 id='if-you-need-extra-support-with-your-registration'>If you need extra support with your registration</h2>

                  <p>
                    Tell <abbr title='HM Revenue and Customs'>HMRC</abbr> when you register if you need extra support with your registration because
                    of a health condition or your personal circumstances.
                  </p>

                  <h3 id='if-you-need-someone-to-register-on-your-behalf'>If you need someone to register on your behalf</h3>

                  <p>
                    You can ask someone else to register for you. You’ll need to{' '}
                    <a className='govuk-link' href='https://www.gov.uk/appoint-agent'>
                      authorise them to deal with <abbr title='HM Revenue and Customs'>HMRC</abbr> on your behalf
                    </a>{' '}
                    before they can register your birds for you.
                  </p>

                  <h2 id='what-happens-when-you-register-with-hmrc'>
                    What happens when you register with <abbr title='HM Revenue and Customs'>HMRC</abbr>
                  </h2>

                  <p>
                    <abbr title='HM Revenue and Customs'>HMRC</abbr> will review your registration. They will check the details of your birds and the
                    premises where they are kept.
                  </p>

                  <p>
                    Normally, <abbr title='HM Revenue and Customs'>HMRC</abbr> will contact you within 6 weeks of receiving your registration. They
                    will confirm your registration reference and what the next step is.
                  </p>

                  <div role='note' aria-label='Information' className='application-notice info-notice'>
                    <p>
                      Once you’re registered, <abbr title='HM Revenue and Customs'>HMRC</abbr> will contact you if there is a bird flu outbreak in
                      your area and tell you what you need to do to protect your flock.
                    </p>
                  </div>

                  <p>
                    You must tell <abbr title='HM Revenue and Customs'>HMRC</abbr> if your details change after you register. Changes can include:
                  </p>

                  <ul>
                    <li>the number of birds you keep</li>
                    <li>the species you keep</li>
                    <li>your contact details or the address where the birds are kept</li>
                  </ul>

                  <p>Keep your registration reference to update your details.</p>

                  <h3 id='if-you-stop-keeping-poultry'>If you stop keeping poultry</h3>

                  <p>
                    You must tell <abbr title='HM Revenue and Customs'>HMRC</abbr> if you no longer keep any poultry or other captive birds.&nbsp;
                  </p>

                  <p>You can either do this online or by post using the address provided when you registered.</p>

                  <p>
                    Your registration will be closed. You will need to register again if you start keeping poultry or other captive birds in the
                    future.
                  </p>

                  <p>
                    If you move your birds to new premises, do not close your registration. You will not need to register again - update your
                    registration with the new address instead.
                  </p>

                  <h3 id='if-you-suspect-avian-disease-in-your-birds'>If you suspect avian disease in your birds</h3>

                  <p>
                    You must{' '}
                    <a className='govuk-link' href='/guidance/report-a-notifiable-disease-in-animals'>
                      notify avian disease immediately
                    </a>{' '}
                    if you suspect bird flu (avian influenza) or Newcastle disease in your flock. Failure to do so is an offence.
                  </p>

                  <p>This service is free and available at all times.</p>

                  <div role='note' aria-label='Information' className='application-notice info-notice'>
                    <p>
                      You can notify avian disease even if you have not yet registered your birds with{' '}
                      <abbr title='HM Revenue and Customs'>HMRC</abbr>.
                    </p>
                  </div>

                  <h3 id='if-a-disease-outbreak-is-confirmed'>If a disease outbreak is confirmed</h3>

                  <p>
                    You must follow the{' '}
                    <a className='govuk-link' rel='external' href='https://www.gov.uk/guidance/bird-flu-avian-influenza-latest-situation-in-england'>
                      latest bird flu rules
                    </a>{' '}
                    and any restrictions set out in a{' '}
                    <a className='govuk-link' rel='external' href='https://www.gov.uk/government/collections/avian-influenza-prevention-zones'>
                      Avian Influenza Prevention Zone
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
                          href='/guidance/bird-flu-avian-influenza-how-to-spot-and-report-it'
                        >
                          Bird flu (avian influenza): how to spot and report it
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"2","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/guidance/apply-for-a-county-parish-holding-cph-number'
                        >
                          Apply for a county parish holding (CPH) number
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"3","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/guidance/poultry-on-farm-welfare'
                        >
                          Poultry welfare on farms
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"4","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/guidance/biosecurity-and-preventing-disease-in-captive-birds'
                        >
                          Biosecurity and preventing disease in captive birds
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"5","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/guidance/moving-poultry-and-hatching-eggs'
                        >
                          Moving poultry and hatching eggs
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--sidebar govuk-link gem-c-related-navigation__section-link--inline  govuk-link gem-c-related-navigation__section-link--other'
                          data-ga4-link='{"event_name":"navigation","type":"related content","index_section":"1","index_link":"6","index_section_count":"2","index_total":"6","section":"Related content"}'
                          href='/government/collections/keeping-farmed-animals-detailed-information'
                        >
                          Keeping farmed animals: detailed information
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
                          href='/government/collections/hmrc-poultry-registration-detailed-information'
                        >
                          HMRC poultry registration: detailed information
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
                          href='/browse/environment-countryside/keeping-farmed-animals'
                        >
                          Keeping farmed animals
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
                          href='https://www.gov.uk/government/organisations/animal-and-plant-health-agency'
                        >
                          Animal and Plant Health Agency (APHA)
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
                          href='https://www.nfuonline.com/'
                        >
                          National Farmers&apos; Union (NFU)
                        </a>
                      </li>
                      <li className='gem-c-related-navigation__link'>
                        <a
                          className='govuk-link govuk-link gem-c-related-navigation__section-link govuk-link gem-c-related-navigation__section-link--footer  govuk-link gem-c-related-navigation__section-link--other'
                          rel='external'
                          data-ga4-link='{"event_name":"navigation","type":"contextual footer","index_section":"2","index_link":"4","index_section_count":"2","index_total":"4","section":"Elsewhere on the web"}'
                          href='https://www.bhwt.org.uk/'
                        >
                          British Hen Welfare Trust
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </main>
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
