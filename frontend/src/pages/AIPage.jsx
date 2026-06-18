import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AIPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I am your AI Trading Assistant. How can I help you analyze the markets today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-screen bg-[#0a0a0a] text-white/90 font-inter overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 relative flex flex-col h-full">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col h-full bg-[#111111]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center gap-4 px-8 py-6 border-b border-white/8 bg-gradient-to-r from-purple-900/40 to-blue-900/40 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-lg font-black text-white shadow-lg">AI</div>
            <div>
              <h2 className="font-bold text-white text-xl">Market Brain</h2>
              <p className="text-[11px] text-purple-300 flex items-center gap-1.5 uppercase tracking-widest font-bold mt-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Online
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-3xl px-6 py-4 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                    : 'bg-[#1a1a1a] border border-white/10 text-white/90 rounded-bl-none shadow-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] border border-white/10 text-white/90 rounded-3xl rounded-bl-none px-6 py-4 flex gap-1.5">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/8 bg-[#171717]/80 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about market trends..."
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500 transition-colors shadow-inner"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute right-2 w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-purple-600"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
            <div className="mt-3 text-center">
               <p className="text-[10px] text-white/30 font-medium">AI analysis is simulated and does not constitute financial advice.</p>
            </div>
          </div>
          
        </div>
      </main>
    </motion.div>
  );
}
