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

  // Avatar display: base64 image OR colored initial circle
  const initials = (userName || 'T').charAt(0).toUpperCase();
  const gradients = ['from-purple-600 to-blue-600', 'from-green-600 to-teal-600', 'from-orange-600 to-red-600', 'from-pink-600 to-purple-600', 'from-blue-600 to-cyan-600'];
  const avatarGrad = gradients[(initials.charCodeAt(0) - 65) % gradients.length];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex h-screen bg-[#0A0906] text-[#F5F0E8]/90 font-inter overflow-hidden">
      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pb-24 md:pb-0 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">

          {/* 📱 Mobile top bar */}
          <div className="md:hidden flex items-center justify-between pt-2">
            <h1 className="text-lg font-black tracking-tight"><span className="text-[#C8833A]">PAPER</span> TRADE</h1>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">My Profile</h2>
            <p className="text-[#F5F0E8]/50 text-sm mt-1">Manage your account details and preferences.</p>
          </div>

          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#131009] border border-[#2A2318] rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Avatar */}
              <div className="relative group shrink-0">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-[#2A2318]" />
                ) : (
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-4xl font-black text-white border-2 border-[#2A2318]`}>
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Change photo"
                >
                  <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[#F5F0E8]/40 uppercase tracking-widest font-bold block mb-1">Display Name</label>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        maxLength={50}
                        className="w-full bg-[#0A0906] border border-[#2A2318] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#C8833A]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#F5F0E8]/40 uppercase tracking-widest font-bold block mb-1">Bio (max 200 chars)</label>
                      <textarea
                        value={editBio}
                        onChange={e => setEditBio(e.target.value)}
                        maxLength={200}
                        rows={3}
                        placeholder="Tell other traders about yourself..."
                        className="w-full bg-[#0A0906] border border-[#2A2318] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#C8833A]/50 transition-colors resize-none custom-scrollbar"
                      />
                      <p className="text-[10px] text-[#F5F0E8]/30 text-right mt-0.5">{editBio.length}/200</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 bg-[#3de530] text-[#003a00] text-sm font-black rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button onClick={() => { setIsEditing(false); setEditName(userName); setEditBio(bio); }} className="px-5 py-2.5 bg-[#2A2318]/60 border border-[#2A2318] text-[#F5F0E8]/60 text-sm font-bold rounded-xl hover:bg-[#2A2318] transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-[#F5F0E8]">{userName}</h3>
                    <p className="text-sm text-[#F5F0E8]/40 mt-0.5">{email}</p>
                    {bio && <p className="text-sm text-[#F5F0E8]/60 mt-3 leading-relaxed">{bio}</p>}
                    {!bio && <p className="text-sm text-white/25 mt-3 italic">No bio yet. Click Edit Profile to add one.</p>}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#F5F0E8]/50 hover:text-white bg-[#2A2318]/60 hover:bg-[#2A2318] px-4 py-2 rounded-xl border border-[#2A2318] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span> Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Available Balance', value: `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'account_balance_wallet', color: 'text-green-400' },
              { label: 'Account Type', value: 'Paper Trader', icon: 'school', color: 'text-blue-400' },
              { label: 'Platform', value: 'Paper Trade Elite', icon: 'trending_up', color: 'text-purple-400' },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-[#131009] border border-[#2A2318] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`material-symbols-outlined text-[18px] ${card.color}`}>{card.icon}</span>
                  <p className="text-[10px] text-[#F5F0E8]/40 uppercase tracking-widest font-bold">{card.label}</p>
                </div>
                <p className="text-lg font-bold text-white font-mono">{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#120000] border border-red-500/20 rounded-3xl p-6">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">warning</span> Account Actions
            </h4>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors">
                <span className="material-symbols-outlined text-[16px]">logout</span> Sign Out
              </button>
            </div>
          </motion.div>

        </div>
      </main>
    </motion.div>
  );
}

