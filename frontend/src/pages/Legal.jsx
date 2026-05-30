import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Sidebar from '../components/Sidebar';

// ── SVG: Lady Justice (Scales) for Terms
const LadyJusticeSVG = ({ progress = 0 }) => (
  <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Glow aura */}
    <defs>
      <radialGradient id="aura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3 * progress} />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="100" cy="140" rx="90" ry="90" fill="url(#aura)" />

    {/* Pillar / Staff */}
    <rect x="98" y="40" width="4" height="180" rx="2" fill="#7c3aed" opacity={progress} filter="url(#glow)" />

    {/* Cross beam */}
    <rect x="40" y="80" width="120" height="4" rx="2" fill="#a78bfa" opacity={progress} filter="url(#glow)" />

    {/* Left scale pan */}
    <line x1="55" y1="84" x2="55" y2={110 + (1 - progress) * 20} stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />
    <ellipse cx="55" cy={112 + (1 - progress) * 20} rx="18" ry="5" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />
    {/* Right scale pan */}
    <line x1="145" y1="84" x2="145" y2={115 - (1 - progress) * 15} stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />
    <ellipse cx="145" cy={117 - (1 - progress) * 15} rx="18" ry="5" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />

    {/* Chains / hanging */}
    <path d="M55 84 Q47 92 55 100" stroke="#7c3aed" strokeWidth="1" opacity={progress * 0.5} />
    <path d="M145 84 Q153 92 145 100" stroke="#7c3aed" strokeWidth="1" opacity={progress * 0.5} />

    {/* Sword */}
    <line x1="100" y1="220" x2="100" y2="260" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity={progress} />
    <path d="M90 222 L110 222 L100 200 Z" fill="#7c3aed" opacity={progress} />
    <rect x="85" y="218" width="30" height="4" rx="2" fill="#a78bfa" opacity={progress} />

    {/* Crown */}
    <path d="M82 44 L88 56 L100 48 L112 56 L118 44 L114 60 L86 60 Z" fill="#a78bfa" opacity={progress} filter="url(#glow)" />

    {/* Stars */}
    {[...Array(5)].map((_, i) => (
      <circle
        key={i}
        cx={30 + i * 35}
        cy={30 + Math.sin(i * 1.2) * 10}
        r={1.5}
        fill="#c4b5fd"
        opacity={progress * (0.5 + 0.5 * Math.sin(i))}
      />
    ))}
  </svg>
);

// ── SVG: Shield with Eye for Privacy
const PrivacyShieldSVG = ({ progress = 0 }) => (
  <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="shieldAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3 * progress} />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </radialGradient>
      <filter id="cyanGlow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="100" cy="120" rx="85" ry="85" fill="url(#shieldAura)" />

    {/* Shield body */}
    <path
      d="M100 20 L170 50 L170 110 Q170 170 100 210 Q30 170 30 110 L30 50 Z"
      fill="none"
      stroke="#06b6d4"
      strokeWidth="2.5"
      strokeLinejoin="round"
      opacity={progress}
      filter="url(#cyanGlow)"
    />
    {/* Shield inner */}
    <path
      d="M100 35 L158 60 L158 110 Q158 160 100 195 Q42 160 42 110 L42 60 Z"
      fill="#06b6d4"
      fillOpacity={0.07 * progress}
      stroke="#06b6d4"
      strokeWidth="1"
      opacity={progress}
    />

    {/* Eye outer */}
    <path d="M60 115 Q100 80 140 115 Q100 150 60 115 Z" fill="none" stroke="#22d3ee" strokeWidth="2" opacity={progress} filter="url(#cyanGlow)" />
    {/* Iris */}
    <circle cx="100" cy="115" r="18" fill="none" stroke="#06b6d4" strokeWidth="2" opacity={progress} />
    {/* Pupil */}
    <circle cx="100" cy="115" r="8" fill="#22d3ee" opacity={progress * 0.8} filter="url(#cyanGlow)" />
    {/* Glint */}
    <circle cx="95" cy="110" r="2.5" fill="white" opacity={progress * 0.8} />

    {/* Lock icon bottom */}
    <rect x="85" y="165" width="30" height="22" rx="4" fill="none" stroke="#06b6d4" strokeWidth="1.8" opacity={progress} />
    <path d="M88 165 Q88 155 100 155 Q112 155 112 165" fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" opacity={progress} />
    <circle cx="100" cy="176" r="3" fill="#22d3ee" opacity={progress} />
    <line x1="100" y1="179" x2="100" y2="184" stroke="#22d3ee" strokeWidth="1.5" opacity={progress} />

    {/* Digital circuit lines */}
    {[0, 1, 2].map(i => (
      <line key={i} x1={50 + i * 35} y1="200" x2={65 + i * 35} y2="215" stroke="#06b6d4" strokeWidth="1" opacity={progress * 0.4} strokeLinecap="round"/>
    ))}
  </svg>
);

// ── Scroll-animated section
const AnimatedSection = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
};

const PRIVACY_SECTIONS = [
  {
    num: '01', title: 'Information We Collect',
    content: 'We collect information you provide directly to us when you create or modify your account, use interactive features, or communicate with us. This includes your name, email address, profile photo, and virtual trading history.'
  },
  {
    num: '02', title: 'How We Use Your Data',
    content: 'We use collected information to provide, maintain, and improve our services, develop new features, and protect Paper Trade Elite and our users. We also use this information to offer you a personalized trading experience.'
  },
  {
    num: '03', title: 'Data Sharing Policy',
    content: 'We do not sell or rent your personal information to third parties. We may share data only as described in this policy — such as with your explicit consent, or as necessary to deliver the services you requested.'
  },
  {
    num: '04', title: 'Security Measures',
    content: 'We implement industry-standard security measures including encrypted tokens, hashed credentials, HTTP-only cookies, rate limiting, and strict CORS policies to protect your information from unauthorized access.'
  },
  {
    num: '05', title: 'Your Rights',
    content: 'You have the right to access, correct, or delete your personal information at any time through your Profile settings. You may also contact our support team to exercise these rights.'
  },
];

const TERMS_SECTIONS = [
  {
    num: '01', title: 'Acceptance of Terms',
    content: 'By accessing or using Paper Trade Elite, you agree to be bound by these Terms of Use. If you do not agree to all terms, please discontinue use of the platform immediately.'
  },
  {
    num: '02', title: 'Educational Purpose Only',
    content: 'Paper Trade Elite is a simulation platform designed strictly for educational and entertainment purposes. No real money is involved. No actual financial transactions occur. All currency values are virtual and have no real-world monetary value.'
  },
  {
    num: '03', title: 'Not Financial Advice',
    content: 'Nothing on this platform constitutes financial, investment, or trading advice. You are solely responsible for any real-world financial decisions. Consult a licensed financial advisor before making real investments.'
  },
  {
    num: '04', title: 'Synthetic Market Data',
    content: 'When markets are closed, the platform uses an AI-driven synthetic data engine to simulate realistic market behavior. This data is mathematically generated for educational purposes and does not reflect actual market conditions.'
  },
  {
    num: '05', title: 'Account Responsibility',
    content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.'
  },
  {
    num: '06', title: 'Disclaimer of Warranties',
    content: 'The platform is provided on an "as is" and "as available" basis. We make no warranties of any kind, express or implied, regarding the accuracy of market data, uptime, or fitness for any particular purpose.'
  },
];

export default function Legal() {
  const [activeTab, setActiveTab] = useState('privacy');
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const iconProgress = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const [iconVal, setIconVal] = useState(0);

  useEffect(() => {
    // Animate icon in on mount
    let frame;
    let start = null;
    const duration = 1600;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setIconVal(eased);
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    // delay slightly
    const t = setTimeout(() => { frame = requestAnimationFrame(animate); }, 300);
    return () => { clearTimeout(t); cancelAnimationFrame(frame); };
  }, [activeTab]);

  const sections = activeTab === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const accent = activeTab === 'privacy' ? 'cyan' : 'purple';
  const accentClasses = {
    tab:    activeTab === 'privacy' ? 'bg-cyan-500 text-black' : 'bg-purple-500 text-white',
    num:    activeTab === 'privacy' ? 'text-cyan-400' : 'text-purple-400',
    border: activeTab === 'privacy' ? 'border-cyan-500/20' : 'border-purple-500/20',
    dot:    activeTab === 'privacy' ? 'bg-cyan-400' : 'bg-purple-400',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex h-screen bg-[#080808] text-white/90 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── HERO / ICON SECTION ──────────────────────── */}
        <div ref={heroRef} className="relative min-h-[420px] flex flex-col items-center justify-center px-6 pt-16 pb-8 overflow-hidden">
          {/* Radial bg */}
          <div className={`absolute inset-0 pointer-events-none ${activeTab === 'privacy' ? 'bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08)_0%,transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08)_0%,transparent_70%)]'}`} />

          {/* Animated Icon */}
          <motion.div
            key={activeTab}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-44 h-44 mb-8"
          >
            {activeTab === 'privacy'
              ? <PrivacyShieldSVG progress={iconVal} />
              : <LadyJusticeSVG progress={iconVal} />
            }
          </motion.div>

          <motion.h1
            key={`h-${activeTab}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl font-black text-white text-center tracking-tight"
          >
            {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
          </motion.h1>
          <motion.p
            key={`p-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-3 text-white/40 text-center text-sm max-w-md"
          >
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </motion.p>

          {/* Tabs */}
          <div className="flex gap-3 mt-8">
            {['privacy', 'terms'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIconVal(0); }}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === tab
                  ? (tab === 'privacy' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25' : 'bg-purple-500 text-white shadow-lg shadow-purple-500/25')
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab === 'privacy' ? '🔐 Privacy Policy' : '⚖️ Terms of Use'}
              </button>
            ))}
          </div>
        </div>

        {/* ── DIVIDER ──────────────────────────────────── */}
        <div className={`mx-auto max-w-4xl px-6 mb-12`}>
          <div className={`h-px ${activeTab === 'privacy' ? 'bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-purple-500/40 to-transparent'}`} />
        </div>

        {/* ── CONTENT SECTIONS ─────────────────────────── */}
        <div className="max-w-4xl mx-auto px-6 pb-20 space-y-6">
          {sections.map((sec, i) => (
            <AnimatedSection key={`${activeTab}-${i}`} delay={i * 0.07}>
              <div className={`group relative bg-[#111111] border ${accentClasses.border} rounded-3xl p-8 hover:bg-[#151515] transition-colors duration-300`}>
                {/* Number accent */}
                <span className={`absolute top-6 right-8 text-7xl font-black ${accentClasses.num} opacity-[0.06] select-none pointer-events-none`}>
                  {sec.num}
                </span>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full ${accentClasses.dot} shrink-0 mt-2`} />
                  <div>
                    <h3 className="text-lg font-black text-white mb-2 tracking-tight">{sec.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed">{sec.content}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}

          {/* Footer note */}
          <AnimatedSection delay={sections.length * 0.07}>
            <div className="text-center pt-6">
              <p className="text-white/25 text-xs">
                For questions about this policy, contact us at{' '}
                <a href="mailto:support@papertrade.com" className={`${activeTab === 'privacy' ? 'text-cyan-400/60 hover:text-cyan-400' : 'text-purple-400/60 hover:text-purple-400'} transition-colors`}>
                  support@papertrade.com
                </a>
              </p>
              <p className="text-white/15 text-[10px] mt-2 uppercase tracking-widest">Paper Trade Elite © {new Date().getFullYear()}</p>
            </div>
          </AnimatedSection>
        </div>

      </main>
    </motion.div>
  );
}
