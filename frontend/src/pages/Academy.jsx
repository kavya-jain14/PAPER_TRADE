import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyDesk, PageHeader, Panel, SegmentedControl } from '../components/workspace/Workspace';
import { patternsData } from '../data/patterns';
import { useMarketSession } from '../hooks/useMarketStatus';

const FOUNDATIONS = [
  {
    id: 'sessions', title: 'Market sessions and platform modes', time: '6 min',
    summary: 'Know when an NSE quote is live and when the simulator takes over.',
    body: [
      'The NSE equity pre-open starts at 09:00 IST. Continuous normal-market trading runs from 09:15 to 15:30 on trading days. Published holidays and announced special sessions can change the calendar.',
      'Paper Trade uses live quote mode only during the normal market session. Before open, after close, on weekends and on known holidays, orders use the deterministic simulator. The active mode is always shown beside the session status and is written into new ledger entries.',
    ],
    checklist: ['Check the LIVE or SIMULATED label before every order.', 'Treat after-hours prices as practice scenarios, not executable exchange quotes.', 'Use the ledger mode column when reviewing fills.'],
  },
  {
    id: 'ohlc', title: 'OHLC candles and timeframes', time: '8 min',
    summary: 'Read what each candle records without over-interpreting its shape.',
    body: [
      'A candle records open, high, low and close for one interval. Its body spans open to close; its wicks show the extremes reached during that interval.',
      'A pattern on a five-minute chart describes a different market horizon from the same shape on a daily chart. Read the timeframe, prior trend, nearby levels and volume before naming a setup.',
    ],
    checklist: ['Start with the timeframe.', 'Mark the prior trend and obvious support or resistance.', 'Wait for the candle to close before evaluating its final geometry.'],
  },
  {
    id: 'orders', title: 'How a paper market order is filled', time: '7 min',
    summary: 'Understand the quote, validation and portfolio changes behind Buy and Sell.',
    body: [
      'A market order asks the platform to use the current server-resolved paper quote. The server validates the symbol, quantity, available balance and owned quantity; it does not trust the browser price.',
      'A buy reduces virtual cash and updates average cost. A sell reduces quantity and realizes the difference between fill price and average cost for the quantity sold. This simulator does not model order-book depth, slippage or brokerage.',
    ],
    checklist: ['Review quantity and estimated notional.', 'Confirm the quote mode and freshness.', 'Read the updated position and ledger after execution.'],
  },
  {
    id: 'pnl', title: 'Cost basis, equity and P&L', time: '7 min',
    summary: 'Separate cash, position value, unrealized P&L and realized P&L.',
    body: [
      'Account equity is available virtual cash plus the marked value of open positions. Unrealized P&L changes with the current mark; it becomes realized only when a position is sold.',
      'Average cost is a weighted average across buys. A percentage return without its capital base can be misleading, so review both rupee P&L and percentage P&L.',
    ],
    checklist: ['Do not count unrealized gains as available cash.', 'Compare P&L with invested capital.', 'Use closed trades—not open marks—when reviewing win rate.'],
  },
  {
    id: 'risk', title: 'Position sizing and invalidation', time: '9 min',
    summary: 'Define what makes an idea wrong before deciding how much to buy.',
    body: [
      'A setup is incomplete without an invalidation level. The distance from entry to invalidation determines risk per share; position size should follow from the amount of virtual capital you are willing to risk.',
      'Paper trading is useful for rehearsing consistent sizing. Avoid increasing size only because a previous trade lost, and avoid judging a process from one result.',
    ],
    checklist: ['Write the entry and invalidation first.', 'Calculate risk per share before quantity.', 'Review a series of trades under the same rules.'],
  },
  {
    id: 'patterns', title: 'Using patterns as evidence', time: '8 min',
    summary: 'A pattern is a description of price geometry, not a prediction by itself.',
    body: [
      'Candlestick and chart patterns summarize how buyers and sellers interacted over a chosen interval. Their usefulness depends on context, clean data and a clearly defined confirmation rule.',
      'The pattern library below uses illustrative geometry only. It does not claim that a named stock produced a verified historical setup, and no pattern guarantees a reversal or continuation.',
    ],
    checklist: ['Require prior-trend context.', 'Define confirmation and invalidation.', 'Test the rule on many examples before trusting it.'],
  },
];

const cleanDescription = (value) => value
  .replaceAll('MASSIVE', 'strong')
  .replaceAll('massive', 'strong')
  .replaceAll('powerful', 'notable')
  .replaceAll('Powerful', 'Notable')
  .replaceAll('absolute', 'clear')
  .replaceAll('VERY reliable', 'commonly discussed')
  .replaceAll('very reliable', 'commonly discussed')
  .replaceAll('Pure panic selling indicator', 'May reflect sustained selling pressure');

function PatternDiagram({ pattern }) {
  const candles = useMemo(() => {
    return pattern.animationCandles.reduce(({ base, items }, candle) => ({
      base: base + candle.c,
      items: [...items, { open: base + candle.o, close: base + candle.c, high: base + candle.h, low: base + candle.l }],
    }), { base: 100, items: [] }).items;
  }, [pattern]);
  const low = Math.min(...candles.map((item) => item.low));
  const high = Math.max(...candles.map((item) => item.high));
  const range = high - low || 1;
  const toY = (value) => 142 - ((value - low) / range) * 104;
  const gap = 300 / Math.max(candles.length, 3);

  return (
    <div style={{ padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
      <svg viewBox="0 0 340 168" width="100%" height="210" role="img" aria-label={`Illustrative ${pattern.title} candle geometry`}>
        {[38, 90, 142].map((y) => <line key={y} x1="20" x2="320" y1={y} y2={y} stroke="rgba(244,238,230,0.06)" />)}
        {candles.map((candle, index) => {
          const x = 40 + index * gap;
          const up = candle.close >= candle.open;
          const color = up ? 'var(--color-positive)' : 'var(--color-negative)';
          const bodyTop = Math.min(toY(candle.open), toY(candle.close));
          const bodyHeight = Math.max(2, Math.abs(toY(candle.open) - toY(candle.close)));
          return <g key={x}><line x1={x} x2={x} y1={toY(candle.high)} y2={toY(candle.low)} stroke={color} strokeWidth="2" /><rect x={x - 9} y={bodyTop} width="18" height={bodyHeight} fill={color} /></g>;
        })}
      </svg>
      <p className="type-caption-muted" style={{ margin: 0 }}>Illustrative geometry · not historical market data</p>
    </div>
  );
}

export default function Academy() {
  const navigate = useNavigate();
  const session = useMarketSession();
  const [section, setSection] = useState('Foundations');
  const [selectedLesson, setSelectedLesson] = useState(FOUNDATIONS[0]);
  const library = useMemo(() => patternsData.filter((item) => item.category !== 'Market Guide'), []);
  const categories = useMemo(() => ['All', ...new Set(library.map((item) => item.category))], [library]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedPattern, setSelectedPattern] = useState(library[0]);
  const visiblePatterns = library.filter((item) => (category === 'All' || item.category === category) && item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell marketStatus={session.mode}>
      <main className="workspace-page">
        <div className="workspace-page__inner">
          <PageHeader title="Study" description="Market foundations first; technical patterns with context second." session={session} actions={<SegmentedControl label="Study section" value={section} options={['Foundations', 'Pattern library']} onChange={setSection} />} />

          {section === 'Foundations' ? (
            <div className="study-layout">
              <Panel title="Learning path" meta={`${FOUNDATIONS.length} concise modules`}>
                <nav aria-label="Market foundation lessons">
                  {FOUNDATIONS.map((lesson, index) => <button key={lesson.id} type="button" onClick={() => setSelectedLesson(lesson)} className={`study-row ${selectedLesson.id === lesson.id ? 'is-active' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{lesson.title}</strong><small>{lesson.summary}</small></div><em>{lesson.time}</em></button>)}
                </nav>
              </Panel>
              <Panel title={selectedLesson.title} meta={selectedLesson.time}>
                <article className="study-article">
                  {selectedLesson.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  <h3>Practice checklist</h3>
                  <ol>{selectedLesson.checklist.map((item) => <li key={item}>{item}</li>)}</ol>
                  <div className="study-note">Educational material only. Paper trading does not remove market risk and simulated fills do not reproduce every real-market condition.</div>
                </article>
              </Panel>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}><SegmentedControl label="Pattern category" value={category} options={categories} onChange={setCategory} /><input className="desk-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patterns" aria-label="Search patterns" /></div>
              <div className="study-layout">
                <Panel title="Pattern index" meta={`${visiblePatterns.length} entries`}>
                  {visiblePatterns.length === 0 ? <EmptyDesk title="No matching patterns" detail="Adjust the category or search term." /> : <div style={{ maxHeight: 650, overflowY: 'auto' }}>{visiblePatterns.map((pattern) => <button key={pattern.id} type="button" onClick={() => setSelectedPattern(pattern)} className={`study-row study-row--pattern ${selectedPattern?.id === pattern.id ? 'is-active' : ''}`}><div><strong>{pattern.title}</strong><small>{pattern.category}</small></div><em>{pattern.type}</em></button>)}</div>}
                </Panel>
                {selectedPattern && <Panel title={selectedPattern.title} meta={`${selectedPattern.category} · ${selectedPattern.type}`}>
                  <div className="pattern-study"><PatternDiagram pattern={selectedPattern} /><div><h3>What it describes</h3><p>{cleanDescription(selectedPattern.desc)}</p><h3>Context checklist</h3><ol><li>Confirm the prior trend: {selectedPattern.preTrendDir > 0 ? 'the reference geometry assumes an uptrend.' : 'the reference geometry assumes a downtrend.'}</li><li>Wait for all candles in the formation to close.</li><li>Look for liquidity, volume and nearby support or resistance.</li><li>Define confirmation and invalidation before placing a paper order.</li></ol><button className="desk-button desk-button--primary" type="button" onClick={() => navigate('/markets')}>Open markets</button></div></div>
                </Panel>}
              </div>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
