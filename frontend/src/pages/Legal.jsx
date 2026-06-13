import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Sidebar from '../components/Sidebar';

// ── SVG: Scales of Justice for Terms
const LadyJusticeSVG = ({ progress = 0 }) => (
  <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
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
    <rect x="98" y="40" width="4" height="180" rx="2" fill="#7c3aed" opacity={progress} filter="url(#glow)" />
    <rect x="40" y="80" width="120" height="4" rx="2" fill="#a78bfa" opacity={progress} filter="url(#glow)" />
    <line x1="55" y1="84" x2="55" y2={110 + (1 - progress) * 20} stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />
    <ellipse cx="55" cy={112 + (1 - progress) * 20} rx="18" ry="5" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />
    <line x1="145" y1="84" x2="145" y2={115 - (1 - progress) * 15} stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />
    <ellipse cx="145" cy={117 - (1 - progress) * 15} rx="18" ry="5" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity={progress} />
    <path d="M55 84 Q47 92 55 100" stroke="#7c3aed" strokeWidth="1" opacity={progress * 0.5} />
    <path d="M145 84 Q153 92 145 100" stroke="#7c3aed" strokeWidth="1" opacity={progress * 0.5} />
    <line x1="100" y1="220" x2="100" y2="260" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity={progress} />
    <path d="M90 222 L110 222 L100 200 Z" fill="#7c3aed" opacity={progress} />
    <rect x="85" y="218" width="30" height="4" rx="2" fill="#a78bfa" opacity={progress} />
    <path d="M82 44 L88 56 L100 48 L112 56 L118 44 L114 60 L86 60 Z" fill="#a78bfa" opacity={progress} filter="url(#glow)" />
    {[...Array(5)].map((_, i) => (
      <circle key={i} cx={30 + i * 35} cy={30 + Math.sin(i * 1.2) * 10} r={1.5} fill="#c4b5fd" opacity={progress * (0.5 + 0.5 * Math.sin(i))} />
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
    <path d="M100 20 L170 50 L170 110 Q170 170 100 210 Q30 170 30 110 L30 50 Z" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinejoin="round" opacity={progress} filter="url(#cyanGlow)" />
    <path d="M100 35 L158 60 L158 110 Q158 160 100 195 Q42 160 42 110 L42 60 Z" fill="#06b6d4" fillOpacity={0.07 * progress} stroke="#06b6d4" strokeWidth="1" opacity={progress} />
    <path d="M60 115 Q100 80 140 115 Q100 150 60 115 Z" fill="none" stroke="#22d3ee" strokeWidth="2" opacity={progress} filter="url(#cyanGlow)" />
    <circle cx="100" cy="115" r="18" fill="none" stroke="#06b6d4" strokeWidth="2" opacity={progress} />
    <circle cx="100" cy="115" r="8" fill="#22d3ee" opacity={progress * 0.8} filter="url(#cyanGlow)" />
    <circle cx="95" cy="110" r="2.5" fill="white" opacity={progress * 0.8} />
    <rect x="85" y="165" width="30" height="22" rx="4" fill="none" stroke="#06b6d4" strokeWidth="1.8" opacity={progress} />
    <path d="M88 165 Q88 155 100 155 Q112 155 112 165" fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" opacity={progress} />
    <circle cx="100" cy="176" r="3" fill="#22d3ee" opacity={progress} />
    <line x1="100" y1="179" x2="100" y2="184" stroke="#22d3ee" strokeWidth="1.5" opacity={progress} />
    {[0, 1, 2].map(i => (
      <line key={i} x1={50 + i * 35} y1="200" x2={65 + i * 35} y2="215" stroke="#06b6d4" strokeWidth="1" opacity={progress * 0.4} strokeLinecap="round" />
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
    num: '01',
    title: 'Information We Collect',
    content: `We collect information you provide directly when you create an account, update your profile, or interact with our platform. This includes your full name, email address, profile photograph (if provided), and virtual trading activity. When you use Google OAuth to sign in, we receive your name, email, and public Google profile photo from Google's Identity Platform. We do not collect real financial information, payment card details, or banking credentials of any kind.`,
  },
  {
    num: '02',
    title: 'How We Use Your Information',
    content: `Your information is used solely to operate and improve Paper Trade. Specifically, we use it to: (i) create and authenticate your account; (ii) track and display your virtual trading history and portfolio performance; (iii) personalize your dashboard and user experience; (iv) communicate important service updates or security notices; and (v) analyse aggregated, anonymized usage patterns to improve platform features. We do not use your information for advertising profiling, third-party marketing, or AI model training without explicit consent.`,
  },
  {
    num: '03',
    title: 'Data Sharing and Disclosure',
    content: `We do not sell, rent, or trade your personal information to any third party. Your data may be shared in limited circumstances: (i) with infrastructure service providers (e.g., MongoDB Atlas for database hosting) who are bound by strict data processing agreements and may not use your data for their own purposes; (ii) when required by applicable law, court order, or governmental authority; or (iii) with your explicit written consent for a specific purpose. All third-party processors we engage are contractually obligated to maintain confidentiality and security standards equivalent to or exceeding our own.`,
  },
  {
    num: '04',
    title: 'Data Retention',
    content: `We retain your account data for as long as your account remains active. If you choose to delete your account, we will permanently remove your personal information from our active systems within 30 days. Transaction records necessary for audit purposes may be retained in anonymized form for up to 12 months in compliance with internal data governance policies. Backup copies are purged within 90 days of account deletion.`,
  },
  {
    num: '05',
    title: 'Security Measures',
    content: `We implement industry-standard technical and organisational security measures to protect your data. These include: bcrypt password hashing with a cost factor of 12; JSON Web Token (JWT)-based authentication with short-lived access tokens (24 hours) and rotatable refresh tokens stored as HTTP-only, SameSite-Strict cookies; per-IP rate limiting on all authentication endpoints; strict CORS policy permitting only whitelisted origins; and helmet.js HTTP security headers. Despite these measures, no transmission over the internet is 100% secure. We encourage you to use a strong, unique password and enable two-factor authentication on your email account.`,
  },
  {
    num: '06',
    title: 'Cookies and Local Storage',
    content: `Paper Trade uses browser localStorage to store your authentication token and watchlist preferences for session continuity. We use an HTTP-only secure cookie for your refresh token. We do not use third-party tracking cookies or advertising cookies. By using the platform, you consent to this limited use of browser storage. You may clear your browser storage at any time, which will log you out of the platform.`,
  },
  {
    num: '07',
    title: 'Your Rights and Choices',
    content: `You have the following rights regarding your personal data: (i) Access — you may request a copy of all personal data we hold about you; (ii) Rectification — you may correct inaccurate information via your Profile settings; (iii) Erasure — you may request permanent deletion of your account and all associated data; (iv) Portability — you may request an export of your trading history in CSV format; (v) Objection — you may object to specific processing activities. To exercise any of these rights, please contact us at support@papertrade.com. We will respond within 30 days.`,
  },
  {
    num: '08',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. Material changes will be communicated via an in-app notification at least 14 days before they take effect. Your continued use of the platform after the effective date constitutes acceptance of the updated policy. We maintain a version history of this document, available upon request.`,
  },
];

const TERMS_SECTIONS = [
  {
    num: '01',
    title: 'Acceptance of Terms',
    content: `By accessing, registering for, or using Paper Trade ("the Platform"), you confirm that you have read, understood, and agree to be legally bound by these Terms of Use ("Terms") and our Privacy Policy, which is incorporated herein by reference. If you do not agree to these Terms in their entirety, you must immediately discontinue all access and use of the Platform. These Terms constitute a binding legal agreement between you and Paper Trade.`,
  },
  {
    num: '02',
    title: 'Nature of the Platform — Educational Use Only',
    content: `Paper Trade is an entirely simulated stock market trading platform designed exclusively for educational, research, and entertainment purposes. The Platform operates using virtual currency (simulated Indian Rupees, ₹) that has no real-world monetary value, cannot be converted to actual currency, and represents no claim against any financial institution. No real money is deposited, invested, withdrawn, or transferred at any time. Paper Trade is not a registered broker-dealer, investment adviser, financial planner, or securities exchange, and is not regulated by SEBI, RBI, or any other financial regulatory authority.`,
  },
  {
    num: '03',
    title: 'Not Financial, Investment, or Trading Advice',
    content: `Nothing on this Platform constitutes, or should be construed as, financial advice, investment advice, trading advice, or any recommendation to buy, sell, or hold any real security, commodity, currency, or other financial instrument. Simulated trading performance on this Platform is not indicative of future results in real markets. Market conditions, liquidity, slippage, brokerage fees, taxes, and emotional factors affect real trading in ways that cannot be fully replicated in a simulation. You are solely responsible for any real-world financial decisions you make. Always consult a licensed and qualified financial adviser before making real investment decisions.`,
  },
  {
    num: '04',
    title: 'Synthetic Market Data',
    content: `When Indian financial markets are closed (outside 9:15 AM – 3:30 PM IST on NSE trading days, and on weekends and public holidays), the Platform uses an AI-driven synthetic data engine to generate simulated price movements. This data is mathematically modelled to reflect realistic market behaviour and volatility patterns, but it does not represent actual market conditions, real-time prices, or any guaranteed future price trajectory. During market hours, the Platform uses publicly available market data sourced from Yahoo Finance's API; however, we make no warranty as to the accuracy, completeness, or timeliness of such data.`,
  },
  {
    num: '05',
    title: 'Eligibility and Account Registration',
    content: `You must be at least 13 years of age (or the applicable age of digital consent in your jurisdiction) to use the Platform. By registering, you represent that all information you provide is accurate, current, and complete, and that you will keep it updated. You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your account, use another user's account, or create multiple accounts for the purpose of gaining unfair advantages. We reserve the right to suspend or terminate accounts that violate these provisions without prior notice.`,
  },
  {
    num: '06',
    title: 'Prohibited Conduct',
    content: `You agree not to: (i) use the Platform for any unlawful purpose; (ii) attempt to reverse-engineer, decompile, or extract source code from the Platform; (iii) introduce malware, viruses, or harmful code; (iv) use automated bots, scrapers, or scripts to interact with the Platform without written authorisation; (v) attempt to gain unauthorised access to other users' accounts or the Platform's backend infrastructure; (vi) post or transmit defamatory, harassing, or offensive content through any Platform feature; or (vii) engage in any conduct that disrupts, degrades, or impairs the Platform's performance for other users.`,
  },
  {
    num: '07',
    title: 'Intellectual Property',
    content: `All content, features, and functionality on the Platform — including but not limited to the software, design, graphics, algorithms, UI elements, and brand identity — are owned by Paper Trade and are protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform for its intended educational purpose. Nothing in these Terms transfers any intellectual property rights to you. Unauthorised reproduction, distribution, or commercial exploitation of any Platform content is strictly prohibited.`,
  },
  {
    num: '08',
    title: 'Disclaimer of Warranties',
    content: `The Platform is provided on an "as is" and "as available" basis, without warranties of any kind, express or implied. To the fullest extent permitted by applicable law, we disclaim all warranties including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Platform will be error-free, uninterrupted, secure, or that defects will be corrected. Market data accuracy is not guaranteed and may be delayed, incomplete, or incorrect.`,
  },
  {
    num: '09',
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, Paper Trade, its founders, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or other intangible losses, arising out of or related to your access to or use of (or inability to access or use) the Platform. Our aggregate liability to you for any claim arising under these Terms shall not exceed ₹0, as no real money is involved in the Platform.`,
  },
  {
    num: '10',
    title: 'Modifications and Termination',
    content: `We reserve the right to modify, suspend, or discontinue the Platform (in whole or in part) at any time, with or without notice. We may also update these Terms from time to time. Material changes will be communicated via in-app notification. Your continued use of the Platform after any changes constitutes your acceptance of the revised Terms. We reserve the right to terminate your account if you breach these Terms, with or without prior notice, at our sole discretion.`,
  },
  {
    num: '11',
    title: 'Governing Law and Dispute Resolution',
    content: `These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict-of-law principles. Any dispute arising out of or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts of New Delhi, India. Before initiating formal legal proceedings, you agree to first attempt to resolve the dispute informally by contacting us at support@papertrade.com and allowing 30 days for resolution.`,
  },
];

const LAST_UPDATED = 'June 13, 2025';
const VERSION = '2.1';

export default function Legal() {
  const [activeTab, setActiveTab] = useState('privacy');
  const [iconVal, setIconVal] = useState(0);
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token } })
        .then(r => r.json())
        .then(d => {
          setUserName(d.name ? d.name.split(' ')[0] : '');
          setBalance(d.virtualBalance || d.balance || 0);
          setAvatar(d.avatar || '');
        }).catch(() => {});
    }
    const checkMarket = () => {
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = ist.getDay();
      const mins = ist.getHours() * 60 + ist.getMinutes();
      setIsMarketOpen(day >= 1 && day <= 5 && mins >= 555 && mins < 930);
    };
    checkMarket();
    const iv = setInterval(checkMarket, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let frame;
    let start = null;
    const duration = 1400;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setIconVal(eased);
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    const t = setTimeout(() => { frame = requestAnimationFrame(animate); }, 300);
    return () => { clearTimeout(t); cancelAnimationFrame(frame); };
  }, [activeTab]);

  const sections = activeTab === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  const accentClasses = {
    num:    activeTab === 'privacy' ? 'text-cyan-400' : 'text-purple-400',
    border: activeTab === 'privacy' ? 'border-cyan-500/15 hover:border-cyan-500/30' : 'border-purple-500/15 hover:border-purple-500/30',
    dot:    activeTab === 'privacy' ? 'bg-cyan-400' : 'bg-purple-400',
    glow:   activeTab === 'privacy' ? 'bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.07)_0%,transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.07)_0%,transparent_70%)]',
    divider: activeTab === 'privacy' ? 'via-cyan-500/30' : 'via-purple-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-screen bg-[#080808] text-white/90 overflow-hidden"
    >
      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />

      <main className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── HERO SECTION ── */}
        <div className={`relative min-h-[460px] flex flex-col items-center justify-center px-6 pt-16 pb-10 overflow-hidden`}>
          <div className={`absolute inset-0 pointer-events-none ${accentClasses.glow}`} />

          {/* Animated Icon */}
          <motion.div
            key={activeTab}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="w-40 h-40 mb-8"
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
            transition={{ duration: 0.55, delay: 0.15 }}
            className="text-5xl font-black text-white text-center tracking-tight"
          >
            {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
          </motion.h1>

          <motion.div
            key={`meta-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="flex items-center gap-3 mt-3 flex-wrap justify-center"
          >
            <span className="text-white/35 text-xs font-semibold">Last Updated: {LAST_UPDATED}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/35 text-xs font-semibold">Version {VERSION}</span>
          </motion.div>

          {/* Tab Toggle */}
          <div className="flex gap-3 mt-8">
            {[
              { key: 'privacy', label: '🔐 Privacy Policy', active: 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25' },
              { key: 'terms',   label: '⚖️ Terms of Use',   active: 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setIconVal(0); }}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? tab.active
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="mx-auto max-w-4xl px-6 mb-10">
          <div className={`h-px bg-gradient-to-r from-transparent ${accentClasses.divider} to-transparent`} />
        </div>

        {/* ── INTRO BLURB ── */}
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <AnimatedSection>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
              <p className="text-white/50 text-sm leading-relaxed">
                {activeTab === 'privacy'
                  ? 'Paper Trade is committed to protecting your privacy. This Privacy Policy explains what information we collect, why we collect it, how we use it, and the choices you have. By using the Platform, you agree to the collection and use of information in accordance with this policy. We do not collect, store, or process any real financial data.'
                  : 'Please read these Terms of Use carefully before using Paper Trade. These Terms govern your access to and use of the Platform. Paper Trade is a simulated trading environment for educational purposes only — no real money, securities, or financial transactions are involved at any time. Your use of the Platform constitutes acceptance of these Terms.'}
              </p>
            </div>
          </AnimatedSection>
        </div>

        {/* ── CONTENT SECTIONS ── */}
        <div className="max-w-4xl mx-auto px-6 pb-20 space-y-4">
          {sections.map((sec, i) => (
            <AnimatedSection key={`${activeTab}-${i}`} delay={i * 0.05}>
              <div className={`group relative bg-[#111111] border ${accentClasses.border} rounded-3xl p-7 transition-colors duration-300 hover:bg-[#141414]`}>
                {/* Background number */}
                <span className={`absolute top-5 right-7 text-7xl font-black ${accentClasses.num} opacity-[0.05] select-none pointer-events-none leading-none`}>
                  {sec.num}
                </span>

                <div className="flex items-start gap-4">
                  <div className={`mt-2.5 w-2 h-2 rounded-full ${accentClasses.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${accentClasses.num} opacity-60`}>{sec.num}</span>
                      <h3 className="text-base font-black text-white tracking-tight">{sec.title}</h3>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed">{sec.content}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}

          {/* ── CONTACT & FOOTER NOTE ── */}
          <AnimatedSection delay={sections.length * 0.05}>
            <div className="mt-6 bg-white/[0.02] border border-white/5 rounded-3xl p-7 text-center">
              <div className={`w-10 h-10 rounded-xl ${activeTab === 'privacy' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-purple-500/10 border border-purple-500/20'} flex items-center justify-center mx-auto mb-4`}>
                <span className="material-symbols-outlined text-white/50 text-[20px]">mail</span>
              </div>
              <p className="text-white/40 text-sm mb-1">Questions about this policy?</p>
              <a
                href="mailto:support@papertrade.com"
                className={`font-bold text-sm transition-colors ${activeTab === 'privacy' ? 'text-cyan-400 hover:text-cyan-300' : 'text-purple-400 hover:text-purple-300'}`}
              >
                support@papertrade.com
              </a>
              <div className="mt-6 pt-5 border-t border-white/5">
                <p className="text-white/20 text-[10px] uppercase tracking-widest font-semibold">
                  Paper Trade &copy; {new Date().getFullYear()} &nbsp;&bull;&nbsp; All rights reserved &nbsp;&bull;&nbsp; Version {VERSION}
                </p>
                <p className="text-white/15 text-[9px] mt-1">
                  This platform is not affiliated with NSE, BSE, SEBI, or any registered financial institution.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>

      </main>
    </motion.div>
  );
}
