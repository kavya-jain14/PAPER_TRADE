import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// 🚀 CUSTOM 'P' MERGED WITH 'T' IN A BOX LOGO
const PTLogo = ({ className = "w-16 h-16" }) => (
  <svg viewBox="0 0 100 100" className={`${className} text-[#C8833A] drop-shadow-[0_0_10px_rgba(200,131,58,0.5)]`} fill="none" stroke="currentColor">
    {/* The Outer Box */}
    <rect x="15" y="15" width="70" height="70" rx="16" strokeWidth="6" />
    {/* The Top Bar of 'T' */}
    <path d="M 32 35 L 68 35" strokeWidth="6" strokeLinecap="round" />
    {/* The Shared Vertical Line for 'P' and 'T' */}
    <path d="M 42 35 L 42 65" strokeWidth="6" strokeLinecap="round" />
    {/* The Loop of 'P' */}
    <path d="M 42 35 L 54 35 A 10 10 0 0 1 54 55 L 42 55" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

// 🟢 THE PURE-CODED INSTITUTIONAL CHART BACKGROUND 📈
const LiveChartBackground = () => {
  const chart = useMemo(() => {
    const points = 35; 
    const width = 1200;
    const step = width / points;

    const greenCurve = [];
    const redCurve = [];
    const blueCurve = [];

    for (let i = 0; i <= points; i++) {
      const x = i * step;
      greenCurve.push({ x, y: 580 - (i * 11) + Math.sin(i * 0.5) * 45 });
      redCurve.push({ x, y: 40 + (i * 10) + Math.cos(i * 0.4) * 45 });
      blueCurve.push({ x, y: 310 + Math.sin(i * 0.25) * 100 });
    }

    const makePath = (data) => `M ${data.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return {
      greenData: greenCurve,
      redData: redCurve,
      greenPath: makePath(greenCurve),
      redPath: makePath(redCurve),
      bluePath: makePath(blueCurve),
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0906]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A2318_1px,transparent_1px),linear-gradient(to_bottom,#2A2318_1px,transparent_1px)] bg-[size:50px_50px] opacity-[0.3]"></div>
      
      <svg className="absolute w-full h-full opacity-50" preserveAspectRatio="none" viewBox="0 0 1200 600">
        <motion.path d={chart.bluePath} fill="none" stroke="#2A2318" strokeWidth="1.5" strokeDasharray="5 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, ease: "easeOut" }} />
        <motion.path d={chart.greenPath} fill="none" stroke="#C8833A" strokeWidth="2" opacity="0.25" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, ease: "easeOut" }} />
        <motion.path d={chart.redPath} fill="none" stroke="#E8A855" strokeWidth="2" opacity="0.15" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, ease: "easeOut" }} />

        {chart.greenData.map((p, i) => {
          if (i === 0 || i === chart.greenData.length - 1) return null; 
          const isDoji = i % 3 === 0; 
          const boxH = isDoji ? 2 : Math.random() * 25 + 10; 
          const wickH = boxH + Math.random() * 30 + 15; 
          const isGreenCandle = Math.random() > 0.3; 
          const candleColor = isGreenCandle ? "text-[#C8833A]" : "text-[#F5F0E8]/20";

          return (
            <motion.g key={`g-${i}`} className={candleColor} initial={{ opacity: 0, y: 20 }} animate={{ opacity: [0.3, 1, 0.3], y: 0 }} transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: i * 0.1 }}>
              <line x1={p.x} y1={p.y - wickH/2} x2={p.x} y2={p.y + wickH/2} stroke="currentColor" strokeWidth="1.5" />
              <rect x={p.x - 4} y={p.y - boxH/2} width="8" height={boxH} fill="currentColor" rx="1" />
            </motion.g>
          )
        })}

        {chart.redData.map((p, i) => {
          if (i === 0 || i === chart.redData.length - 1) return null;
          const isDoji = i % 4 === 0; 
          const boxH = isDoji ? 2 : Math.random() * 30 + 10;
          const wickH = boxH + Math.random() * 30 + 15;
          const isGreenCandle = Math.random() > 0.7; 
          const candleColor = isGreenCandle ? "text-[#C8833A]" : "text-[#F5F0E8]/20";

          return (
            <motion.g key={`r-${i}`} className={candleColor} initial={{ opacity: 0, y: -20 }} animate={{ opacity: [0.3, 1, 0.3], y: 0 }} transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: i * 0.15 }}>
              <line x1={p.x} y1={p.y - wickH/2} x2={p.x} y2={p.y + wickH/2} stroke="currentColor" strokeWidth="1.5" />
              <rect x={p.x - 4} y={p.y - boxH/2} width="8" height={boxH} fill="currentColor" rx="1" />
            </motion.g>
          )
        })}
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0906] via-[#0A0906]/30 to-[#0A0906]/80"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0906]/95 via-transparent to-[#0A0906]/90"></div>
    </div>
  );
};

// 🔴 THE MAIN LOGIN COMPONENT
function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false); 
  
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const url = isLoginView ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
    const bodyData = isLoginView ? { email, password } : { username: name, email, password };
    const toastMessage = isLoginView ? 'Authenticating credentials...' : 'Deploying your portfolio...';
    
    const toastId = toast.loading(toastMessage);
    
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
          toast.success('Access Granted.', { id: toastId });
          
          setIsInitializing(true);
          setTimeout(() => { navigate('/dashboard'); }, 500); 
        } else {
          toast.success('Account created! ₹10,00,000 virtual capital credited.', { id: toastId, duration: 4000 });
          setIsLoginView(true);
          setPassword(''); 
          setName('');
          setIsLoading(false);
        }
      } else {
        const errorMsg = data.error || data.message || "Invalid request";
        toast.error(errorMsg, { id: toastId });
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('Network Error! Connection lost.', { id: toastId });
      setIsLoading(false);
    } 
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsInitializing(true); 
    try {
      const res = await fetch(`${API_URL}/api/auth/googlelogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.authtoken);
        toast.success("Welcome to Paper Trade!");
        setTimeout(() => { navigate('/dashboard'); }, 500); 
      } else {
        toast.error(data.message || "Google Login Failed. Please check your Google Client ID configuration.");
        console.error('Google Login Error from server:', data);
        setIsInitializing(false);
      }
    } catch (err) {
      toast.error("Network Error");
      setIsInitializing(false);
    }
  };

  return (
    <>
      {/* 🚀 UPGRADED SOLID BLACK LOADER WITH CUSTOM PT LOGO */}
      <AnimatePresence>
        {isInitializing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-50 bg-[#0A0906] flex flex-col items-center justify-center font-mono">
            
            <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="mb-6">
               <PTLogo className="w-20 h-20" />
            </motion.div>
            
            <div className="text-[#C8833A] text-lg tracking-[0.2em] font-bold mb-4 drop-shadow-[0_0_8px_rgba(200,131,58,0.4)]">
              INITIALIZING TERMINAL
            </div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 1], y: [5, 0, 0, -5] }} transition={{ times: [0, 0.2, 0.8, 1], duration: 1.5, repeat: Infinity }} className="text-[#F5F0E8]/50 text-[11px] tracking-widest flex flex-col items-center gap-1.5 uppercase opacity-70">
              <p>Establishing secure connection...</p>
              <p>Fetching live market data...</p>
              <p>Syncing portfolio...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN SCREEN */}
      <div className="h-screen w-full text-[#F5F0E8] font-sans flex relative overflow-hidden selection:bg-[#C8833A]/30">
        
        <LiveChartBackground />

        {/* LEFT SIDE: BRAND IDENTITY */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-24 relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            
            <div className="mb-8">
               <PTLogo className="w-20 h-20" />
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl font-black tracking-tighter drop-shadow-lg">
                <span className="text-[#C8833A]">PAPER</span> TRADE
              </h1>
              <p className="text-[#F5F0E8]/60 text-lg font-light tracking-wide w-[80%] leading-relaxed drop-shadow-md">
                Master the markets with institutional-grade execution speed. Our professional simulation environment mirrors live terminal performance without the capital risk.
              </p>
            </div>
            <div className="flex gap-6 mt-10">
              <div className="bg-[#1C1710]/70 backdrop-blur-md border border-[#2A2318] px-5 py-3 rounded-lg flex items-center gap-3 shadow-lg">
                <span className="material-symbols-outlined text-[#C8833A]">speed</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#F5F0E8]">Ultra Low Latency</span>
              </div>
              <div className="bg-[#1C1710]/70 backdrop-blur-md border border-[#2A2318] px-5 py-3 rounded-lg flex items-center gap-3 shadow-lg">
                <span className="material-symbols-outlined text-[#C8833A]">security</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#F5F0E8]">Secure Protocol</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[460px] bg-[#131009]/95 backdrop-blur-xl p-10 rounded-2xl shadow-[0_0_60px_rgba(200,131,58,0.08)] border border-[#2A2318] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C8833A] to-[#E8A855]"></div>
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#F5F0E8] mb-2">
                {isLoginView ? "Terminal Access" : "Initialize Account"}
              </h2>
              <p className="text-[#F5F0E8]/50 text-sm">
                {isLoginView ? "Authenticate to access the live trading terminal." : "Deploy your simulated portfolio environment."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              
              <AnimatePresence>
                {!isLoginView && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                    <label className="text-[10px] font-bold text-[#F5F0E8]/60 block uppercase tracking-widest">Trader Name</label>
                    <div className="relative group">
                      <input className="w-full bg-[#0A0906]/80 border border-[#2A2318] rounded-lg px-4 py-3 text-[#F5F0E8] outline-none focus:border-[#C8833A] focus:ring-1 focus:ring-[#C8833A]/50 transition-all" id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kavya Jain" required={!isLoginView} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#F5F0E8]/20 group-focus-within:text-[#C8833A] transition-colors">person</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#F5F0E8]/60 block uppercase tracking-widest">Email Designation</label>
                <div className="relative group">
                  <input className="w-full bg-[#0A0906]/80 border border-[#2A2318] rounded-lg px-4 py-3 text-[#F5F0E8] outline-none focus:border-[#C8833A] focus:ring-1 focus:ring-[#C8833A]/50 transition-all" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader.name@gmail.com" required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#F5F0E8]/20 group-focus-within:text-[#C8833A] transition-colors">alternate_email</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-[#F5F0E8]/60 block uppercase tracking-widest">Security Key (Password)</label>
                  {isLoginView && <button type="button" className="text-xs font-semibold text-[#C8833A] hover:underline transition-all">Forgot Password?</button>}
                </div>
                <div className="relative group">
                  <input className="w-full bg-[#0A0906]/80 border border-[#2A2318] rounded-lg px-4 py-3 text-[#F5F0E8] outline-none focus:border-[#C8833A] focus:ring-1 focus:ring-[#C8833A]/50 transition-all font-mono tracking-widest" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#F5F0E8]/20 group-focus-within:text-[#C8833A] transition-colors">lock</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full mt-2 bg-[#C8833A] hover:bg-[#E8A855] text-[#0A0906] font-bold py-3.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] shadow-[0_0_20px_rgba(200,131,58,0.25)] disabled:opacity-70 uppercase tracking-wide text-sm"
              >
                {isLoading ? (
                   <span className="flex items-center gap-2">Processing...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">{isLoginView ? 'login' : 'add_circle'}</span>
                    {isLoginView ? 'Execute Login' : 'Deploy Account'}
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#2A2318]"></div>
              <span className="px-4 text-[10px] text-[#F5F0E8]/40 uppercase tracking-widest font-bold">Or</span>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#2A2318]"></div>
            </div>

            {/* 🚀 GOOGLE AUTH BUTTON */}
            <div className="flex justify-center w-full">
              <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => { toast.error('Google Login Failed'); setIsInitializing(false); }} 
                theme="filled_black"
                shape="rectangular"
                width="100%"
                text="continue_with"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-[#F5F0E8]/50 text-xs">
                {isLoginView ? "New to the platform?" : "Already initialized?"} 
                <button type="button" onClick={() => { setIsLoginView(!isLoginView); setEmail(''); setPassword(''); }} className="text-[#C8833A] font-bold hover:underline ml-1">
                  {isLoginView ? "Register Account" : "Sign In"}
                </button>
              </p>
            </div>
            
          </motion.div>
        </div>

      </div>
    </>
  );
}

export default Login;