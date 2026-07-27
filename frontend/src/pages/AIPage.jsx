import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import useMarketStatus from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const SUGGESTED_PROMPTS = [
  "What is NIFTY 50?",
  "Explain P&L for beginners",
  "Best sectors to watch in 2025?",
  "What is a stop-loss order?",
  "How does paper trading work?",
];

export default function AIPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const marketStatus = useMarketStatus();
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm your AI Trading Assistant powered by Market Brain. Ask me anything about markets, stocks, strategies, or how to use this platform." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token } });
        const data = await res.json();
        if (res.ok) {
          setUserName(data.name ? data.name.split(' ')[0] : 'Trader');
          setAvatar(data.avatar || '');
        }
      } catch { /* ignore */ }
    };
    fetchUser();
  }, [token, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e, overrideText) => {
    if (e) e.preventDefault();
    const text = (overrideText || input).trim();
    if (!text || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/synthetic/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection to Market Brain lost. Please try again.' }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handlePromptClick = (prompt) => {
    handleSend(null, prompt);
  };

  return (
    <AppShell userName={userName} marketStatus={marketStatus} avatar={avatar}>
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Page layout: header + chat window filling height */}
        <div className="flex flex-col h-full max-w-[900px] mx-auto w-full p-4 md:p-8 pb-4 gap-4">
          
          {/* Header */}
          <header className="flex items-end justify-between shrink-0 pb-4 border-b border-border">
            <div>
              <Motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="type-h2 mb-1">
                Market Brain
              </Motion.h1>
              <Motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
                <p className="type-caption uppercase tracking-widest">AI Assistant Online</p>
              </Motion.div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
              <span className="material-symbols-outlined text-accent" style={{fontSize: '14px'}}>smart_toy</span>
              <span className="type-caption text-accent font-medium">Powered by AI</span>
            </div>
          </header>

          {/* Chat Window */}
          <div className="flex-1 bg-surface border border-border rounded-lg overflow-hidden flex flex-col shadow-1 min-h-0">
            
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
              {messages.map((msg, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <span className="material-symbols-outlined text-accent" style={{fontSize: '14px'}}>smart_toy</span>
                    </div>
                  )}
                  <div className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-lg text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent text-bg rounded-br-sm font-medium'
                      : 'bg-surface-raised border border-border text-text-primary rounded-bl-sm'
                  }`}>
                    {msg.role === 'ai' && (
                      <p className="type-caption text-accent mb-1.5">Market Brain</p>
                    )}
                    {msg.content}
                  </div>
                </Motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <span className="material-symbols-outlined text-accent" style={{fontSize: '14px'}}>smart_toy</span>
                  </div>
                  <div className="bg-surface-raised border border-border rounded-lg rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </div>
                </div>
              )}

              {/* Suggested prompts (shown only at start) */}
              {messages.length === 1 && !isTyping && (
                <div className="pt-2">
                  <p className="type-caption-muted mb-3 text-center">Suggested questions</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handlePromptClick(prompt)}
                        className="px-3 py-1.5 bg-surface-raised hover:bg-border border border-border rounded-full type-caption text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="shrink-0 p-4 border-t border-border bg-surface-raised/40">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about markets, stocks, or strategies..."
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 type-body text-text-primary placeholder-text-tertiary outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 flex items-center justify-center bg-accent hover:opacity-90 text-bg rounded-lg transition-all disabled:opacity-30 shrink-0"
                >
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>send</span>
                </button>
              </form>
              <p className="type-caption-muted text-center mt-2">AI analysis is simulated and does not constitute financial advice.</p>
            </div>

          </div>
        </div>
      </Motion.div>
    </AppShell>
  );
}
