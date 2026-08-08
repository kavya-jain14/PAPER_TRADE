import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { PageHeader, Panel, SegmentedControl } from '../components/workspace/Workspace';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const CONTACT = 'kavyajain1407@gmail.com';

const PRIVACY = [
  ['Information stored', 'Paper Trade stores the name and email used to create your account, a hashed password for password-based accounts, optional profile bio and avatar, virtual balance, paper positions, trade history and a hashed refresh-token record. Google sign-in can provide a name, email and public profile image. The platform does not ask for bank, card, demat or brokerage credentials.'],
  ['How it is used', 'Account data is used to authenticate you, maintain the paper portfolio and ledger, calculate platform rankings, and show your selected profile details. A display name and paper-account equity may appear in the in-product ranking table.'],
  ['Browser storage and cookies', 'The browser stores the short-lived access token and watchlist preferences in localStorage. A refresh token is set in an HTTP-only cookie. Clearing site data signs you out and removes local preferences, but it does not delete server-side account or trade records.'],
  ['Service providers', 'Database, application-hosting and quote-data providers process the information needed to run the service. Their availability and security practices are outside the application’s direct control. Paper Trade does not provide an advertising-cookie or payment workflow.'],
  ['Security', 'Passwords are hashed before storage. Authenticated API routes use signed access tokens, refresh tokens are stored as hashes on the server, and production refresh cookies are configured as HTTP-only and secure. No internet service can promise complete security; use a unique password and protect your email account.'],
  ['Your controls', 'You can edit your display name, bio and avatar, export the visible trade ledger to CSV, and sign out from Profile. The current application does not include self-service account deletion. For account or data questions, contact the address below.'],
  ['Retention and changes', 'Account and trading records remain stored while the account exists or until the operator removes them. No automatic deletion schedule is currently offered in the product. This notice may change with the application; the updated date will be revised when material text changes.'],
];

const TERMS = [
  ['Simulation only', 'Paper Trade is an educational simulator. Its rupee balance is virtual and has no cash value. No real money can be deposited, withdrawn or transferred. The platform is not a broker, exchange or investment adviser and does not execute orders on NSE or BSE.'],
  ['No financial advice', 'Charts, study material, pattern diagrams, rankings, market summaries and rule-engine signals are for learning. They are not recommendations or promises of return. Real trading can involve loss, liquidity limits, slippage, fees, taxes and operational risks that this simulator does not reproduce.'],
  ['Quote and simulation modes', 'On covered NSE trading days, the application attempts to use external quote data during the 09:15–15:30 IST normal session. Before and after that session, on weekends and on configured holidays, it uses generated simulation prices. Special sessions depend on the maintained calendar. Quotes can be delayed, unavailable or incorrect. Always read the LIVE or SIMULATED label.'],
  ['Order model', 'The current platform supports paper market buys and sells for its tracked symbols. The server resolves the fill price and validates balance or owned quantity. Limit orders, order-book depth, partial fills, brokerage, taxes and guaranteed execution are not implemented.'],
  ['Account responsibility', 'Provide accurate registration details, keep credentials private and do not attempt to access another user’s account. Do not use the service to introduce harmful code, overwhelm endpoints, bypass controls or interfere with other users.'],
  ['Availability and changes', 'The service is provided as available and can experience errors or downtime. Features, data sources, supported symbols and these terms may change as the project develops. The updated date on this page identifies the current text.'],
];

export default function Legal() {
  const session = useMarketSession();
  const [tab, setTab] = useState('Privacy');
  const [user, setUser] = useState({ name: '', avatar: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const controller = new AbortController();
    fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && setUser({ name: data.name?.split(' ')[0] || 'Trader', avatar: data.avatar || '' }))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const sections = tab === 'Privacy' ? PRIVACY : TERMS;

  return (
    <AppShell userName={user.name} marketStatus={session.mode} avatar={user.avatar}>
      <main className="workspace-page">
        <div className="workspace-page__inner" style={{ maxWidth: 900 }}>
          <PageHeader title={tab === 'Privacy' ? 'Privacy notice' : 'Terms of use'} description="Last updated 8 August 2026 · plain-language project notice." actions={<SegmentedControl label="Legal document" value={tab} options={['Privacy', 'Terms']} onChange={setTab} />} />
          <Panel>
            <div className="legal-copy">
              <p className="legal-copy__intro">{tab === 'Privacy' ? 'This notice describes the data the current Paper Trade application actually handles and the controls currently available.' : 'These terms describe the limits of the current educational simulator. Use the platform only if you understand that no real trade is executed.'}</p>
              {sections.map(([title, content], index) => <section key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{title}</h2><p>{content}</p></div></section>)}
              <footer><p>Questions about this notice or your account</p><a href={`mailto:${CONTACT}`}>{CONTACT}</a><small>Paper Trade is not affiliated with NSE, BSE or SEBI.</small></footer>
            </div>
          </Panel>
        </div>
      </main>
    </AppShell>
  );
}
