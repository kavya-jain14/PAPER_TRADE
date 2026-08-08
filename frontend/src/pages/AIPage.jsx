import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PageHeader, Panel } from '../components/workspace/Workspace';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const PROMPTS = [
  'How does the NSE trading session work?',
  'Explain paper trading for a beginner',
  'What is a stop-loss?',
  'Show the current signal for RELIANCE',
];

export default function AIPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const session = useMarketSession();
  const transcriptRef = useRef(null);
  const [user, setUser] = useState({ name: '', avatar: '' });
  const [messages, setMessages] = useState([{ role: 'desk', content: 'Ask a market concept or request a tracked-symbol signal. Signals are educational outputs from the platform rule engine.' }]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const controller = new AbortController();
    fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && setUser({ name: data.name?.split(' ')[0] || 'Trader', avatar: data.avatar || '' }))
      .catch(() => {});
    return () => controller.abort();
  }, [navigate, token]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages, pending]);

  const send = async (event, suggested) => {
    event?.preventDefault();
    const message = (suggested || input).trim();
    if (!message || pending) return;
    setMessages((items) => [...items, { role: 'user', content: message }]);
    setInput('');
    setPending(true);
    try {
      const response = await fetch(`${API_URL}/api/synthetic/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Market desk unavailable');
      setMessages((items) => [...items, { role: 'desk', content: data.reply }]);
    } catch (error) {
      setMessages((items) => [...items, { role: 'desk', content: error.message || 'The market desk could not respond. Try again shortly.' }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <AppShell userName={user.name} marketStatus={session.mode} avatar={user.avatar}>
      <main className="workspace-page">
        <div className="workspace-page__inner" style={{ maxWidth: 1120 }}>
          <PageHeader title="Market desk" description="Plain-language market guidance and rule-based tracked-symbol signals." session={session} />

          <div className="workspace-grid workspace-grid--two">
            <Panel title="Briefing transcript" meta="Educational only · not financial advice">
              <div ref={transcriptRef} style={{ height: 'min(54vh, 560px)', minHeight: 360, overflowY: 'auto' }}>
                {messages.map((message, index) => <div key={`${message.role}-${index}`} style={{ display: 'grid', gridTemplateColumns: '88px minmax(0, 1fr)', gap: 16, padding: '14px 16px', borderBottom: '1px solid var(--color-border)', background: message.role === 'user' ? 'rgba(244,238,230,0.012)' : 'transparent' }}><span className="type-label" style={{ color: message.role === 'user' ? 'var(--color-text-muted)' : 'var(--color-accent)' }}>{message.role === 'user' ? 'You' : 'Market desk'}</span><p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-body)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{message.content}</p></div>)}
                {pending && <div style={{ padding: '14px 16px', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-caption)' }}>Market desk is checking the request…</div>}
              </div>
              <form onSubmit={send} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--color-border)' }}>
                <input className="desk-input" style={{ flex: 1 }} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a market question" maxLength={300} aria-label="Market question" />
                <button className="desk-button desk-button--primary" type="submit" disabled={!input.trim() || pending}>Send</button>
              </form>
            </Panel>

            <div style={{ display: 'grid', alignContent: 'start', gap: 16 }}>
              <Panel title="Start with a question">
                <div style={{ display: 'grid' }}>{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={(event) => send(event, prompt)} style={{ padding: '12px 16px', border: 0, borderBottom: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', textAlign: 'left', font: 'inherit', fontSize: 'var(--text-caption)', cursor: 'pointer' }}>{prompt}</button>)}</div>
              </Panel>
              <Panel title="How to read a signal">
                <dl style={{ margin: 0, padding: 16, display: 'grid', gap: 14 }}>
                  <div><dt className="type-label">Regime</dt><dd className="type-caption" style={{ margin: '3px 0 0' }}>Trend classification from recent candles.</dd></div>
                  <div><dt className="type-label">RSI</dt><dd className="type-caption" style={{ margin: '3px 0 0' }}>Momentum measure; context matters more than a single threshold.</dd></div>
                  <div><dt className="type-label">Probability</dt><dd className="type-caption" style={{ margin: '3px 0 0' }}>A model score, not a guarantee or expected return.</dd></div>
                </dl>
              </Panel>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
