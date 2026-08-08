import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell } from '../components/AppShell';
import { EmptyDesk, PageHeader, Panel } from '../components/workspace/Workspace';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Leaderboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const session = useMarketSession();
  const [user, setUser] = useState({ name: '', avatar: '' });
  const [rows, setRows] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const controller = new AbortController();
    const load = async () => {
      try {
        const [userResponse, rankingResponse] = await Promise.all([
          fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal: controller.signal }),
          fetch(`${API_URL}/api/leaderboard`, { headers: { 'auth-token': token }, signal: controller.signal }),
        ]);
        if (userResponse.ok) {
          const data = await userResponse.json();
          setUser({ name: data.name?.split(' ')[0] || 'Trader', avatar: data.avatar || '' });
        }
        if (!rankingResponse.ok) throw new Error('Ranking unavailable');
        const data = await rankingResponse.json();
        setRows(data.leaderboard || []);
        setCurrent(data.currentUser || null);
      } catch (error) {
        if (error.name !== 'AbortError') toast.error(error.message || 'Failed to load ranking');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [navigate, token]);

  return (
    <AppShell userName={user.name} marketStatus={session.mode} avatar={user.avatar}>
      <main className="workspace-page">
        <div className="workspace-page__inner" style={{ maxWidth: 1000 }}>
          <PageHeader title="Ranking" description="Paper-account equity across eligible platform users." session={session} />

          <div className="workspace-grid">
          {current && <Panel><div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 16 }}><span className="type-data-lg" style={{ color: 'var(--color-accent)' }}>{current.unrankedReason ? '—' : `#${current.rank}`}</span><div><p style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 600 }}>Your current standing</p><p className="type-caption-muted" style={{ margin: 3 }}>{current.unrankedReason ? 'Ranking is unavailable after manual funds were added.' : 'Rank is ordered by current paper-account equity.'}</p></div><span className="type-data-md">{Number.isFinite(current.equity) ? `₹${money(current.equity)}` : '—'}</span></div></Panel>}

          <Panel title="Equity table" meta={`${rows.length} eligible accounts`}>
            {loading ? <EmptyDesk title="Loading ranking" detail="Calculating eligible account equity." /> : rows.length === 0 ? <EmptyDesk title="No ranked accounts" detail="Eligible users will appear after the ranking is calculated." /> : <div className="desk-table-wrap"><table className="desk-table"><thead><tr><th data-numeric>Rank</th><th>Trader</th><th data-numeric>Equity</th></tr></thead><tbody>
              {rows.map((row) => <tr key={row.id}><td data-numeric style={{ color: row.isCurrentUser ? 'var(--color-accent)' : undefined }}>{row.unrankedReason ? '—' : `#${row.rank}`}</td><td style={{ color: row.isCurrentUser ? 'var(--color-text-primary)' : undefined, fontWeight: row.isCurrentUser ? 600 : 400 }}>{row.name}{row.isCurrentUser ? ' · You' : ''}</td><td data-numeric>₹{money(row.equity)}</td></tr>)}
            </tbody></table></div>}
          </Panel>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
