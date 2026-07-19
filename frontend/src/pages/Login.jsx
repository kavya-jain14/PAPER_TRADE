import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

// 36-candle deterministic sequence — long enough that the seam is
// invisible at normal drift speed. Structured as:
// consolidation → pullback → breakout → retest → continuation → distribution → recovery
// Natural variation in body size, wick asymmetry, and local momentum.
const CHART_CANDLES = [
  // Consolidation — tight bodies, mixed direction
  { open: 100, high: 102.5, low: 98.0, close: 101.2 },
  { open: 101.2, high: 103.0, low: 99.5, close: 100.1 },
  { open: 100.1, high: 101.8, low: 97.5, close: 99.4 },
  { open: 99.4, high: 102.2, low: 98.8, close: 101.5 },
  { open: 101.5, high: 102.0, low: 98.0, close: 98.5 },
  // Pullback — bearish sequence, increasing wick length
  { open: 98.5, high: 99.0, low: 94.0, close: 95.2 },
  { open: 95.2, high: 96.5, low: 91.5, close: 92.8 },
  { open: 92.8, high: 94.0, low: 89.0, close: 90.5 },
  // Hammer / reversal signal
  { open: 90.5, high: 91.0, low: 86.5, close: 90.2 },
  // Breakout — strong bullish candles, short lower wicks
  { open: 90.2, high: 98.5, low: 89.5, close: 97.8 },
  { open: 97.8, high: 105.5, low: 96.5, close: 104.2 },
  { open: 104.2, high: 109.0, low: 103.0, close: 107.5 },
  { open: 107.5, high: 110.5, low: 106.0, close: 109.0 },
  // Retest — brief bearish correction
  { open: 109.0, high: 110.0, low: 103.5, close: 104.8 },
  { open: 104.8, high: 106.0, low: 101.5, close: 102.5 },
  // Doji / indecision at support
  { open: 102.5, high: 105.0, low: 100.8, close: 102.8 },
  // Continuation — resumption of uptrend
  { open: 102.8, high: 108.5, low: 101.5, close: 107.0 },
  { open: 107.0, high: 113.0, low: 106.0, close: 111.5 },
  { open: 111.5, high: 116.0, low: 110.0, close: 114.8 },
  { open: 114.8, high: 119.5, low: 113.5, close: 118.0 },
  { open: 118.0, high: 122.5, low: 116.5, close: 121.0 },
  // Distribution — topping wicks, doji, slight reversal
  { open: 121.0, high: 124.5, low: 119.0, close: 120.5 },
  { open: 120.5, high: 123.0, low: 118.0, close: 119.0 },
  { open: 119.0, high: 121.5, low: 116.5, close: 117.5 },
  // Shooting star / bearish signal
  { open: 117.5, high: 120.0, low: 113.5, close: 114.2 },
  // Steep downtrend
  { open: 114.2, high: 115.5, low: 108.5, close: 109.8 },
  { open: 109.8, high: 111.0, low: 104.0, close: 105.2 },
  { open: 105.2, high: 106.5, low: 98.5, close: 99.5 },
  { open: 99.5, high: 102.0, low: 96.0, close: 97.2 },
  { open: 97.2, high: 98.5, low: 93.5, close: 94.5 },
  // Capitulation / extreme low
  { open: 94.5, high: 96.0, low: 88.0, close: 91.0 },
  // Recovery
  { open: 91.0, high: 97.5, low: 90.0, close: 96.5 },
  { open: 96.5, high: 101.5, low: 95.5, close: 100.8 },
  { open: 100.8, high: 103.0, low: 99.5, close: 101.5 },
  { open: 101.5, high: 102.0, low: 98.0, close: 99.5 },
  // Late consolidation (merging back to initial ~100 level)
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
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [authState, setAuthState] = useState('idle');
  const [errorType, setErrorType] = useState(null);

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const countdownRef = useRef(null);
  const utcClockRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

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

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && authState === 'rate_limited') {
      setAuthState('idle');
      setLoginAttempts(0);
    }
    return () => clearTimeout(countdownRef.current);
  }, [countdown, authState]);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorType('invalid');
      return;
    }

    if (loginAttempts >= 3) {
      setAuthState('rate_limited');
      setCountdown(47);
      return;
    }

    setAuthState('loading');
    setErrorType(null);

    const url = isLoginView ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
    const bodyData = isLoginView ? { email, password } : { username: email.split('@')[0], email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      const data = await response.json();

      if (response.ok) {
        if (isLoginView && (data.authtoken || data.token)) {
          const actualToken = data.authtoken || data.token;
          localStorage.setItem('token', actualToken);
          setAuthState('success');
          setTimeout(() => { navigate('/dashboard'); }, 500);
        } else {
          setIsLoginView(true);
          setPassword('');
          setAuthState('idle');
        }
      } else {
        const errorMsg = data.error || data.message || "Invalid request";
        setLoginAttempts(prev => prev + 1);

        if (errorMsg.toLowerCase().includes('locked')) {
          setAuthState('error');
          setErrorType('locked');
        } else if (errorMsg.toLowerCase().includes('rate') || response.status === 429) {
          setAuthState('rate_limited');
          setCountdown(47);
        } else {
          setAuthState('error');
          setErrorType('invalid');
        }
      }
    } catch {
      setAuthState('error');
      setErrorType('network');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setAuthState('loading');
    try {
      const res = await fetch(`${API_URL}/api/auth/googlelogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: credentialResponse.credential || credentialResponse.access_token })
      });
      const data = await res.json();
      if (data.success || data.authtoken) {
        localStorage.setItem('token', data.authtoken || data.token);
        setAuthState('success');
        setTimeout(() => { navigate('/dashboard'); }, 500);
      } else {
        setAuthState('error');
        setErrorType('invalid');
      }
    } catch {
      setAuthState('error');
      setErrorType('network');
    }
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Chart geometry — used for both sequences of the infinite carousel.
  // All candles share the same global min/max so bodies scale consistently
  // across the full 48-candle sequence.
  const chartMin = Math.min(...CHART_CANDLES.map(c => c.low)) - 8;
  const chartMax = Math.max(...CHART_CANDLES.map(c => c.high)) + 8;
  const chartRange = chartMax - chartMin;
  const candleSpacing = 22;   // px between candle centres in viewBox units
  const candleHalfWidth = 5;  // half-body width
  // Each sequence viewBox width = number of candles × spacing
  const seqViewBoxWidth = CHART_CANDLES.length * candleSpacing;

  return (
    <div className={styles.container}>
      <div className={styles.splitLayout}>

        {/* LEFT: WORKSPACE */}
        <div className={`${styles.workspace} ${styles.fadeIn}`}>
          {/* ── Decorative 3D Perspective Grid ──────────────────────── */}
          <div className={styles.perspectiveGrid} aria-hidden="true" tabIndex="-1"></div>

          {/* ── Brand transformation sequence ───────────────────────────────
               Decorative, aria-hidden, not interactive.
               Placed above the background chart (z=4).
          ──────────────────────────────────────────────────── */}
          <div className={logoMorphStyles.wrapper}>
            <LogoMorph decorative />
          </div>

          {/* ── Background candlestick carousel ─────────────────────────
               Seamless infinite horizontal loop.
               Structure: [candlestickTrack]
                            [svgSequence-A]  ← primary
                            [svgSequence-B]  ← aria-hidden duplicate
               Animation: translateX(0) → translateX(-50%) on the track.
               -50% = exactly one sequence width because track = 2 × sequence.
               No React state, no rAF, no timers. Pure CSS transform.
          ─────────────────────────────────────────────────────────────── */}
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

            {errorType === 'network' && (
              <div className={styles.networkErrorBanner}>
                <span>Network / server failure</span>
                <button type="button" className={styles.networkErrorRetry} onClick={() => setAuthState('idle')}>Retry</button>
              </div>
            )}

            <div className={styles.branding}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <img 
                  src="/papertrade-mark.svg" 
                  alt="PaperTrade Logo" 
                  style={{ width: '30px', height: '30px' }} 
                />
                <h1 className={styles.logoText} style={{ margin: 0 }}>PAPER TRADE</h1>
              </div>
              <p className={styles.subtitle}>Institutional Market Simulator</p>
            </div>

            <div className={styles.panelHeader}>
              <h2 className={styles.headerContext}>Authentication</h2>
              <h3 className={styles.headerTitle}>Terminal Access</h3>
              <p className={styles.headerDesc}>Authenticate to access your trading workspace.</p>
            </div>

            {errorType === 'locked' ? (
              <div style={{ color: 'var(--color-negative)', fontFamily: 'var(--font-body)', fontSize: '14px', padding: '16px 0', borderTop: '1px solid var(--color-border)' }}>
                Account locked. <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'underline' }}>Contact Support</a>
              </div>
            ) : (
              <form onSubmit={handleAuth} className={styles.authForm} noValidate>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if(errorType==='invalid') setErrorType(null); }}
                  error={errorType === 'invalid' && !email ? 'Email is required' : ''}
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if(errorType==='invalid') setErrorType(null); }}
                  error={errorType === 'invalid' && email && password ? 'Invalid credentials' : (errorType === 'invalid' && !password ? 'Password is required' : '')}
                  capsLockAware={true}
                />

                <div className={styles.supportingActions} style={{ marginTop: 0 }}>
                  <label className={styles.customCheckboxLabel}>
                    <div className={styles.checkboxWrapper}>
                      <input type="checkbox" className={styles.nativeCheckbox} />
                      <div className={styles.customCheckbox}></div>
                    </div>
                    Remember me
                  </label>
                  <button type="button" className={styles.link}>Forgot password?</button>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <PrimaryButton
                    type="submit"
                    state={authState === 'rate_limited' ? 'disabled' : (authState === 'loading' ? 'loading' : (authState === 'success' ? 'success' : 'idle'))}
                  >
                    {authState === 'rate_limited' ? <span style={{ fontFamily: 'var(--font-mono)' }}>Try again in {formatCountdown(countdown)}</span> : 'Authenticate'}
                  </PrimaryButton>
                </div>
              </form>
            )}

            <div className={styles.divider} />

            <GhostButton onSuccess={handleGoogleSuccess} onError={() => { setAuthState('error'); setErrorType('network'); }} />

            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className={styles.linkPrimary}
                onClick={() => { setIsLoginView(!isLoginView); setAuthState('idle'); setErrorType(null); }}
              >
                {isLoginView ? 'New here? Create account →' : 'Already have access? Login →'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
