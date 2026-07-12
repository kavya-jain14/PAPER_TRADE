import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Profile() {
  const [userName,    setUserName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [bio,         setBio]         = useState('');
  const [avatar,      setAvatar]      = useState('');
  const [balance,     setBalance]     = useState(0);
  const [isMarketOpen,setIsMarketOpen]= useState(false);
  const [isEditing,   setIsEditing]   = useState(false);
  const [editName,    setEditName]    = useState('');
  const [editBio,     setEditBio]     = useState('');
  const [isSaving,    setIsSaving]    = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkMarket = () => {
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const mins = ist.getHours() * 60 + ist.getMinutes();
      setIsMarketOpen(ist.getDay() >= 1 && ist.getDay() <= 5 && mins >= 555 && mins < 930);
    };
    checkMarket();
    const iv = setInterval(checkMarket, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token } });
      const data = await res.json();
      if (res.ok) {
        setUserName(data.name || 'Trader');
        setEmail(data.email || '');
        setBio(data.bio || '');
        setAvatar(data.avatar || '');
        setBalance(data.balance || 0);
        setEditName(data.name || '');
        setEditBio(data.bio || '');
      }
    } catch (err) { console.error(err); }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 400 * 1024) { toast.error('Image must be under 400KB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ name: editName, bio: editBio, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profile updated!');
        setUserName(data.name);
        setBio(data.bio);
        setIsEditing(false);
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { 'auth-token': token }, credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('token');
    navigate('/login');
  };

  const initials = (userName || 'T').charAt(0).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-[#0B0D10] text-[#E5E5E5] font-sans overflow-hidden selection:bg-[#D4A574]/30">
      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 custom-scrollbar relative">
        <div className="max-w-[1200px] mx-auto space-y-12 relative z-10">

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight text-[#E5E5E5] leading-none mb-4">
                User <span className="font-bold">Profile</span>.
              </motion.h1>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5E5E5]/40">Manage your account details</p>
              </motion.div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#EF4444]/20 transition-colors">
              <span className="material-symbols-outlined text-[16px]">logout</span> Sign Out
            </button>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
             
            {/* Main Profile Info */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="xl:col-span-8 bg-[#16181D]/30 border border-[#E5E5E5]/5 rounded-[32px] p-8 md:p-12 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-10">
                
                {/* Avatar */}
                <div className="relative group shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="w-32 h-32 rounded-3xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
                  ) : (
                    <div className={`w-32 h-32 rounded-3xl bg-[#0B0D10] flex items-center justify-center text-5xl font-black text-[#D4A574] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#E5E5E5]/5`}>
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                    title="Change photo"
                  >
                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left w-full">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-[#D4A574] uppercase tracking-widest font-bold block mb-2">Display Name</label>
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          maxLength={50}
                          className="w-full bg-[#0B0D10] border border-[#E5E5E5]/10 rounded-xl px-5 py-3 text-[#E5E5E5] outline-none focus:border-[#D4A574]/50 transition-colors shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#D4A574] uppercase tracking-widest font-bold block mb-2">Bio (max 200 chars)</label>
                        <textarea
                          value={editBio}
                          onChange={e => setEditBio(e.target.value)}
                          maxLength={200}
                          rows={3}
                          placeholder="Tell other traders about yourself..."
                          className="w-full bg-[#0B0D10] border border-[#E5E5E5]/10 rounded-xl px-5 py-3 text-[#E5E5E5] outline-none focus:border-[#D4A574]/50 transition-colors resize-none custom-scrollbar shadow-inner"
                        />
                        <p className="text-[10px] text-[#E5E5E5]/30 text-right mt-1">{editBio.length}/200</p>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-[#D4A574] text-[#0B0D10] text-xs uppercase tracking-widest font-black rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity hover-glow">
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditName(userName); setEditBio(bio); }} className="px-6 py-3 bg-[#16181D] border border-[#E5E5E5]/10 text-[#E5E5E5]/60 text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-[#0B0D10] transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-3xl md:text-4xl font-black text-[#E5E5E5] tracking-tight">{userName}</h3>
                      <p className="text-sm font-mono text-[#D4A574] mt-1">{email}</p>
                      {bio && <p className="text-sm text-[#E5E5E5]/60 mt-4 leading-relaxed max-w-xl">{bio}</p>}
                      {!bio && <p className="text-sm text-[#E5E5E5]/30 mt-4 italic">No bio yet. Click Edit Profile to add one.</p>}
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-6 flex items-center gap-2 text-[10px] uppercase font-bold text-[#E5E5E5]/50 hover:text-[#0B0D10] hover:bg-[#D4A574] bg-[#16181D] px-5 py-2.5 rounded-full border border-[#E5E5E5]/5 transition-all shadow-lg mx-auto sm:mx-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span> Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Sidebar Stats */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="xl:col-span-4 flex flex-col gap-6">
              {[
                { label: 'Available Balance', value: `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'account_balance_wallet', color: 'text-[#4ADE80]' },
                { label: 'Account Type', value: 'Paper Trader', icon: 'school', color: 'text-[#D4A574]' },
                { label: 'Platform', value: 'Paper Trade Elite', icon: 'trending_up', color: 'text-purple-400' },
              ].map((card, i) => (
                <div key={i} className="bg-[#16181D]/30 border border-[#E5E5E5]/5 rounded-[24px] p-6 shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-transform">
                  <div>
                     <p className="text-[10px] text-[#E5E5E5]/40 uppercase tracking-widest font-bold mb-2">{card.label}</p>
                     <p className={`text-xl font-bold font-mono ${card.label === 'Available Balance' ? 'text-[#E5E5E5]' : 'text-[#E5E5E5]/80'}`}>{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-[#0B0D10] border border-[#E5E5E5]/5 flex items-center justify-center shadow-inner ${card.color}`}>
                     <span className={`material-symbols-outlined text-[20px]`}>{card.icon}</span>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </main>
    </motion.div>
  );
}
