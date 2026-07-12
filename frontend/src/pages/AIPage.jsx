import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AIPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I am your AI Trading Assistant. How can I help you analyze the markets today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/synthetic/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection to Market Brain lost. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-[#0B0D10] text-[#E5E5E5] font-sans overflow-hidden selection:bg-[#D4A574]/30">
      <Sidebar />
      <MobileBottomNav />
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1200px] mx-auto space-y-8 h-full flex flex-col">
            
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
              <div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight text-[#E5E5E5] leading-none mb-4">
                  Market <span className="font-bold">Brain</span>.
                </motion.h1>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse shadow-[0_0_10px_#4ADE80]`} />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5E5E5]/40">System Online</p>
                </motion.div>
              </div>
            </header>

            <div className="flex-1 flex flex-col bg-[#16181D]/50 rounded-[32px] overflow-hidden shadow-2xl border border-[#E5E5E5]/5 min-h-[500px]">
              
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[24px] text-lg leading-relaxed shadow-lg transition-transform hover:-translate-y-1 ${
                      msg.role === 'user' 
                        ? 'bg-[#D4A574] text-[#0B0D10] rounded-br-sm' 
                        : 'bg-[#1F2229] border border-[#E5E5E5]/5 text-[#E5E5E5] rounded-bl-sm'
                    }`}>
                      {msg.role === 'ai' && <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#D4A574] mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">smart_toy</span> Brain</div>}
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1F2229] border border-[#E5E5E5]/5 text-[#E5E5E5] rounded-[24px] rounded-bl-sm px-6 py-5 flex gap-2">
                      <span className="w-2.5 h-2.5 bg-[#D4A574] rounded-full animate-bounce" />
                      <span className="w-2.5 h-2.5 bg-[#D4A574] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2.5 h-2.5 bg-[#D4A574] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 bg-[#0B0D10]/30 shrink-0 border-t border-[#E5E5E5]/5 backdrop-blur-md">
                <form onSubmit={handleSend} className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about market trends..."
                    className="w-full bg-[#16181D] border border-[#E5E5E5]/10 rounded-full py-5 pl-8 pr-16 text-lg text-white placeholder-[#E5E5E5]/30 outline-none focus:border-[#D4A574]/50 transition-colors shadow-inner"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || isTyping}
                    className="absolute right-3 w-12 h-12 flex items-center justify-center bg-[#D4A574] hover:bg-[#D4A574]/80 text-[#0B0D10] rounded-full transition-colors disabled:opacity-50 hover-glow"
                  >
                    <span className="material-symbols-outlined text-[24px]">send</span>
                  </button>
                </form>
                <div className="mt-4 text-center">
                   <p className="text-[10px] uppercase tracking-widest text-[#E5E5E5]/20 font-bold">AI analysis is simulated and does not constitute financial advice.</p>
                </div>
              </div>
              
            </div>
            
          </div>
        </div>
      </main>
    </motion.div>
  );
}
