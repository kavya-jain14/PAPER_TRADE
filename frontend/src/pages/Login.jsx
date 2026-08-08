import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import TextField from '../components/ui/TextField';
import PrimaryButton from '../components/ui/PrimaryButton';
import GhostButton from '../components/ui/GhostButton';
import MarketTicker from '../components/ui/MarketTicker';
import LogoMorph from '../components/brand/LogoMorph';
import logoMorphStyles from '../components/brand/LogoMorph.module.css';
import styles from './Login.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Deterministic fallback data for the ticker
const simulatedMarketData = [
  { symbol: "NIFTY 50", price: 24521.37, changePercent: 0.73 },
  { symbol: "SENSEX", price: 80645.12, changePercent: 0.65 },
  { symbol: "BTC/USD", price: 64230.50, changePercent: -1.24 },
  { symbol: "USD/INR", price: 83.45, changePercent: 0.05 },
  { symbol: "RELIANCE", price: 3120.40, changePercent: 1.15 },
  { symbol: "HDFCBANK", price: 1650.75, changePercent: -0.42 },
];

// 36-candle deterministic sequence
const CHART_CANDLES = [
  { open: 100, high: 102.5, low: 98.0, close: 101.2 },
  { open: 101.2, high: 103.0, low: 99.5, close: 100.1 },
  { open: 100.1, high: 101.8, low: 97.5, close: 99.4 },
  { open: 99.4, high: 102.2, low: 98.8, close: 101.5 },
  { open: 101.5, high: 102.0, low: 98.0, close: 98.5 },
  { open: 98.5, high: 99.0, low: 94.0, close: 95.2 },
  { open: 95.2, high: 96.5, low: 91.5, close: 92.8 },
  { open: 92.8, high: 94.0, low: 89.0, close: 90.5 },
  { open: 90.5, high: 91.0, low: 86.5, close: 90.2 },
  { open: 90.2, high: 98.5, low: 89.5, close: 97.8 },
  { open: 97.8, high: 105.5, low: 96.5, close: 104.2 },
  { open: 104.2, high: 109.0, low: 103.0, close: 107.5 },
  { open: 107.5, high: 110.5, low: 106.0, close: 109.0 },
  { open: 109.0, high: 110.0, low: 103.5, close: 104.8 },
  { open: 104.8, high: 106.0, low: 101.5, close: 102.5 },
  { open: 102.5, high: 105.0, low: 100.8, close: 102.8 },
  { open: 102.8, high: 108.5, low: 101.5, close: 107.0 },
  { open: 107.0, high: 113.0, low: 106.0, close: 111.5 },
  { open: 111.5, high: 116.0, low: 110.0, close: 114.8 },
  { open: 114.8, high: 119.5, low: 113.5, close: 118.0 },
  { open: 118.0, high: 122.5, low: 116.5, close: 121.0 },
  { open: 121.0, high: 124.5, low: 119.0, close: 120.5 },
  { open: 120.5, high: 123.0, low: 118.0, close: 119.0 },
  { open: 119.0, high: 121.5, low: 116.5, close: 117.5 },
  { open: 117.5, high: 120.0, low: 113.5, close: 114.2 },
  { open: 114.2, high: 115.5, low: 108.5, close: 109.8 },
  { open: 109.8, high: 111.0, low: 104.0, close: 105.2 },
  { open: 105.2, high: 106.5, low: 98.5, close: 99.5 },
  { open: 99.5, high: 102.0, low: 96.0, close: 97.2 },
  { open: 97.2, high: 98.5, low: 93.5, close: 94.5 },
  { open: 94.5, high: 96.0, low: 88.0, close: 91.0 },
  { open: 91.0, high: 97.5, low: 90.0, close: 96.5 },
  { open: 96.5, high: 101.5, low: 95.5, close: 100.8 },
  { open: 100.8, high: 103.0, low: 99.5, close: 101.5 },
  { open: 101.5, high: 102.0, low: 98.0, close: 99.5 },
  { open: 99.5, high: 101.5, low: 98.0, close: 101.0 },
  { open: 101.0, high: 102.5, low: 99.5, close: 100.2 },
  { open: 100.2, high: 101.5, low: 98.5, close: 99.8 },
  { open: 99.8, high: 101.0, low: 97.5, close: 100.5 },
  { open: 100.5, high: 102.0, low: 99.0, close: 101.0 },
  { open: 101.0, high: 103.0, low: 99.5, close: 100.5 },
  { open: 100.5, high: 102.0, low: 98.5, close: 100.0 },
  { open: 100.0, high: 101.5, low: 98.0, close: 100.5 },
  { open: 100.5, high: 102.0, low: 99.0, close: 101.0 },
  { open: 101.0, high: 102.5, low: 100.0, close: 100.8 },
  { open: 100.8, high: 101.5, low: 99.5, close: 100.2 },
  { open: 100.2, high: 101.0, low: 99.0, close: 100.0 },
  { open: 100.0, high: 100.8, low: 99.2, close: 100.0 }
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.pathname === '/register' ? 'register' : 'login';

  // Explicit Form Values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('paper_trade_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form State
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(localStorage.getItem('paper_trade_remembered_email')));

  const utcClockRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    // Mode switch: clear specific states
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);

    // If redirected from successful registration
    if (mode === 'login' && location.state?.registrationSuccess) {
      setSuccessMessage('Account created successfully. Log in to continue.');
      if (location.state?.registeredEmail) {
        setEmail(location.state.registeredEmail);
      }
      // Clear the location state so it doesn't persist on subsequent refreshes
      window.history.replaceState({}, document.title);
    }
  }, [mode, location.state]);

  useEffect(() => {
    // UTC Clock
    const updateClock = () => {
      const now = new Date();
      if (utcClockRef.current) {
        utcClockRef.current.textContent = now.toISOString().substring(11, 19);
      }
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const handleRegister = async () => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fullName.trim(),
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login", {
          replace: true,
          state: {
            registrationSuccess: true,
            registeredEmail: email.trim().toLowerCase()
          }
        });
      } else {
        const errorMsg = data.message || data.error || "";
        if (errorMsg.toLowerCase().includes('already registered')) {
          setServerError('An account with this email already exists');
        } else {
          setServerError('Unable to create account. Try again.');
        }
      }
    } catch {
      setServerError('Unable to create account. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (response.ok && (data.authtoken || data.token)) {
        if (rememberEmail) localStorage.setItem('paper_trade_remembered_email', email.trim().toLowerCase());
        else localStorage.removeItem('paper_trade_remembered_email');
        localStorage.setItem('token', data.authtoken || data.token);
        navigate('/dashboard');
      } else {
        const errorMsg = data.error || data.message || "Invalid request";

        if (errorMsg.toLowerCase().includes('locked')) {
          setServerError('Account locked. Contact Support');
        } else if (errorMsg.toLowerCase().includes('rate') || response.status === 429) {
          setServerError('Too many attempts. Try again shortly.');
        } else {
          setServerError('Invalid email or password');
        }
        setIsSubmitting(false);
      }
    } catch {
      setServerError('Network / server failure');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (mode === 'register') {
      await handleRegister();
    } else {
      await handleLogin();
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/googlelogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: credentialResponse.credential || credentialResponse.access_token })
      });
      const data = await res.json();
      if (data.success || data.authtoken) {
        localStorage.setItem('token', data.authtoken || data.token);
        navigate('/dashboard');
      } else {
        setServerError('Invalid email or password');
        setIsSubmitting(false);
      }
    } catch {
      setServerError('Network / server failure');
      setIsSubmitting(false);
    }
  };

  // Chart geometry
  const chartMin = Math.min(...CHART_CANDLES.map(c => c.low)) - 8;
  const chartMax = Math.max(...CHART_CANDLES.map(c => c.high)) + 8;
  const chartRange = chartMax - chartMin;
  const candleSpacing = 22;
  const candleHalfWidth = 5;
  const seqViewBoxWidth = CHART_CANDLES.length * candleSpacing;

  return (
    <div className={styles.container}>
      <div className={styles.splitLayout}>

        {/* LEFT: WORKSPACE */}
        <div className={`${styles.workspace} ${styles.fadeIn}`}>
          <div className={styles.perspectiveGrid} aria-hidden="true" tabIndex="-1"></div>

          <div className={logoMorphStyles.wrapper}>
            <LogoMorph decorative />
          </div>

          <div className={styles.candlestickLayer} aria-hidden="true" tabIndex="-1">
            <div className={styles.candlestickTrack}>
              {[0, 1].map((copy) => (
                <svg
                  key={copy}
                  className={styles.candlestickSequence}
                  viewBox={`0 0 ${seqViewBoxWidth} 100`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {CHART_CANDLES.map((candle, i) => {
                    const isPositive = candle.close >= candle.open;
                    const color = isPositive ? 'var(--color-positive)' : 'var(--color-negative)';
                    const x = i * candleSpacing + candleSpacing / 2;
                    const yHigh   = 100 - ((candle.high  - chartMin) / chartRange) * 100;
                    const yLow    = 100 - ((candle.low   - chartMin) / chartRange) * 100;
                    const yOpen   = 100 - ((candle.open  - chartMin) / chartRange) * 100;
                    const yClose  = 100 - ((candle.close - chartMin) / chartRange) * 100;
                    const bodyTop = Math.min(yOpen, yClose);
                    const bodyH   = Math.max(Math.abs(yOpen - yClose), 0.8);
                    return (
                      <g key={i}>
                        <line x1={x} y1={yHigh} x2={x} y2={yLow}
                          stroke={color} strokeWidth="1.2" opacity="0.75" />
                        <rect x={x - candleHalfWidth} y={bodyTop}
                          width={candleHalfWidth * 2} height={bodyH}
                          fill={color} opacity="0.85" />
                      </g>
                    );
                  })}
                </svg>
              ))}
            </div>
          </div>

          <div className={styles.telemetryBar}>
            <span>MODE <span className={styles.telemetryValue}>SIMULATION</span></span>
            <span>·</span>
            <span>DATA <span className={styles.telemetryValue}>DETERMINISTIC</span></span>
            <span>·</span>
            <span>UTC <span ref={utcClockRef} className={styles.telemetryValue}>--:--:--</span></span>
          </div>

          <div className={styles.tickerWrapper}>
            <MarketTicker items={simulatedMarketData} mode="simulated" speed="slow" />
          </div>
        </div>

        {/* RIGHT: AUTH PANEL */}
        <div className={`${styles.authPanel} ${styles.slideIn}`}>
          <div className={styles.authPanelInner}>

            {serverError === 'Network / server failure' && (
              <div className={styles.networkErrorBanner}>
                <span>Network / server failure</span>
                <button type="button" className={styles.networkErrorRetry} onClick={() => setServerError(null)}>Retry</button>
              </div>
            )}

            {successMessage && (
              <div className={styles.successBanner} role="status">
                {successMessage}
              </div>
            )}

            <div className={styles.branding}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <img
                  src="/papertrade-mark.svg"
                  alt="PaperTrade Logo"
                  style={{ width: '30px', height: '30px' }}
                />
                <h1 className={styles.logoText} style={{ margin: 0 }}>PAPERTRADE</h1>
              </div>
              <p className={styles.subtitle}>Institutional Market Simulator</p>
            </div>

            <div className={styles.panelHeader}>
              <h2 className={styles.headerContext}>{mode === 'register' ? 'New account' : 'Authentication'}</h2>
              <h3 className={styles.headerTitle}>{mode === 'register' ? 'Create your account' : 'Terminal Access'}</h3>
              <p className={styles.headerDesc}>
                {mode === 'register'
                  ? 'Set up your PaperTrade workspace and begin with virtual capital.'
                  : 'Authenticate to access your trading workspace.'}
              </p>
            </div>

            {serverError && serverError !== 'Network / server failure' && (
              <div style={{ color: 'var(--color-negative)', fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '16px' }} role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.authForm} noValidate>

              {mode === 'register' && (
                <TextField
                  label="Full name"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setFieldErrors(prev => ({...prev, fullName: null})); }}
                  error={fieldErrors.fullName}
                  autoComplete="name"
                />
              )}

              <TextField
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({...prev, email: null})); setServerError(null); setSuccessMessage(null); }}
                error={fieldErrors.email}
                autoComplete="email"
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({...prev, password: null})); setServerError(null); setSuccessMessage(null); }}
                error={fieldErrors.password}
                capsLockAware={true}
                autoComplete={mode === 'register' ? "new-password" : "current-password"}
              />

              {mode === 'register' && (
                <TextField
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({...prev, confirmPassword: null})); }}
                  error={fieldErrors.confirmPassword}
                  capsLockAware={true}
                  autoComplete="new-password"
                />
              )}

              {mode === 'login' && (
                <div className={styles.supportingActions} style={{ marginTop: 0 }}>
                  <label className={styles.customCheckboxLabel}>
                    <div className={styles.checkboxWrapper}>
                      <input type="checkbox" className={styles.nativeCheckbox} checked={rememberEmail} onChange={(event) => setRememberEmail(event.target.checked)} />
                      <div className={styles.customCheckbox}></div>
                    </div>
                    Remember email
                  </label>
                </div>
              )}

              <div style={{ marginTop: '8px' }}>
                <PrimaryButton
                  type="submit"
                  state={isSubmitting ? 'loading' : 'idle'}
                  loadingLabel={mode === 'register' ? 'Creating account...' : 'Authenticating...'}
                >
                  {mode === 'register' ? 'Create account' : 'Authenticate'}
                </PrimaryButton>
              </div>
            </form>

            <div className={styles.divider} />

            <GhostButton onSuccess={handleGoogleSuccess} onError={() => { setServerError('Network / server failure'); setIsSubmitting(false); }} />

            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link
                to={mode === 'register' ? '/login' : '/register'}
                className={styles.linkPrimary}
                style={{ textDecoration: 'none' }}
              >
                {mode === 'register' ? 'Already have access? Login →' : 'New here? Create account →'}
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
