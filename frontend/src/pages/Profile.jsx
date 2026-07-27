import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AppShell } from '../components/AppShell';
import useMarketStatus from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Profile() {
  const [userName,    setUserName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [bio,         setBio]         = useState('');
  const [avatar,      setAvatar]      = useState('');
  const [balance,     setBalance]     = useState(0);
  const marketStatus = useMarketStatus();
  const [isEditing,   setIsEditing]   = useState(false);
  const [editName,    setEditName]    = useState('');
  const [editBio,     setEditBio]     = useState('');
  const [isSaving,    setIsSaving]    = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');



  useEffect(() => {
    if (!token) { navigate('/login'); return; }

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
      } catch { /* ignore */ }
    };

    fetchProfile();
  }, [token, navigate]);

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
    } catch {
      toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { 'auth-token': token }, credentials: 'include' });
    } catch { /* ignore */ }
    localStorage.removeItem('token');
    navigate('/login');
  };

  const initials = (userName || 'T').charAt(0).toUpperCase();

  return (
    <AppShell userName={userName} marketStatus={marketStatus} avatar={avatar}>
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1000px] mx-auto space-y-8">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
              <div>
                <Motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="type-h2 mb-1">
                  Profile
                </Motion.h1>
                <Motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="type-caption-muted">
                  Manage your account details
                </Motion.p>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 type-caption text-negative/70 hover:text-negative transition-colors bg-negative/5 hover:bg-negative/10 px-3 py-1.5 rounded-lg border border-negative/20">
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>logout</span> Sign Out
              </button>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

              {/* Profile Card */}
              <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-8 bg-surface border border-border rounded-lg p-6 shadow-1">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  
                  {/* Avatar */}
                  <div className="relative group shrink-0">
                    {avatar ? (
                      <img src={avatar} alt="avatar" className="w-24 h-24 rounded-lg object-cover border border-border shadow-1" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-3xl font-black text-accent shadow-1">
                        {initials}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-bg/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                      title="Change photo"
                    >
                      <span className="material-symbols-outlined text-text-primary text-2xl">photo_camera</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>

                  {/* Info / Edit Form */}
                  <div className="flex-1 text-center sm:text-left w-full min-w-0">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="type-label block mb-1">Display Name</label>
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            maxLength={50}
                            className="w-full bg-surface-raised border border-border rounded-lg px-4 py-2.5 type-body text-text-primary outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="type-label block mb-1">Bio <span className="type-caption-muted">(max 200 chars)</span></label>
                          <textarea
                            value={editBio}
                            onChange={e => setEditBio(e.target.value)}
                            maxLength={200}
                            rows={3}
                            placeholder="Tell other traders about yourself..."
                            className="w-full bg-surface-raised border border-border rounded-lg px-4 py-2.5 type-body text-text-primary outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors resize-none custom-scrollbar"
                          />
                          <p className="type-caption-muted text-right mt-1">{editBio.length}/200</p>
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 bg-text-primary text-bg type-label font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button onClick={() => { setIsEditing(false); setEditName(userName); setEditBio(bio); }} className="px-5 py-2.5 bg-surface-raised border border-border text-text-secondary type-label font-bold rounded-lg hover:bg-border transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="type-h3 mb-1 truncate">{userName}</h3>
                        <p className="type-caption text-accent font-mono">{email}</p>
                        {bio && <p className="type-caption-muted mt-3 leading-relaxed">{bio}</p>}
                        {!bio && <p className="type-caption-muted mt-3 italic">No bio yet. Click Edit Profile to add one.</p>}
                        <button
                          onClick={() => setIsEditing(true)}
                          className="mt-4 flex items-center gap-1.5 type-caption text-text-secondary hover:text-text-primary bg-surface-raised hover:bg-border border border-border px-4 py-2 rounded-lg transition-colors mx-auto sm:mx-0"
                        >
                          <span className="material-symbols-outlined" style={{fontSize:'14px'}}>edit</span> Edit Profile
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Motion.div>

              {/* Stats Sidebar */}
              <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-4 flex flex-col gap-4">
                {[
                  { label: 'Available Balance', value: `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'account_balance_wallet', iconColor: 'text-positive' },
                  { label: 'Account Type', value: 'Paper Trader', icon: 'school', iconColor: 'text-accent' },
                  { label: 'Platform', value: 'Paper Trade Elite', icon: 'trending_up', iconColor: 'text-purple-400' },
                ].map((card, i) => (
                  <div key={i} className="bg-surface-raised border border-border rounded-lg p-4 shadow-1 flex items-center justify-between">
                    <div>
                      <p className="type-label mb-1">{card.label}</p>
                      <p className="type-data-sm text-text-primary">{card.value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center ${card.iconColor}`}>
                      <span className="material-symbols-outlined" style={{fontSize:'18px'}}>{card.icon}</span>
                    </div>
                  </div>
                ))}

                {/* Member since / extra info */}
                <div className="bg-surface border border-border rounded-lg p-4 shadow-1">
                  <p className="type-label mb-3">Account Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="type-caption-muted">Email</p>
                      <p className="type-caption text-text-secondary truncate max-w-[160px]">{email}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="type-caption-muted">Market Mode</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'LIVE' ? 'bg-positive animate-pulse' : marketStatus === 'SIMULATED' ? 'bg-accent' : 'bg-text-tertiary'}`} />
                        <p className="type-caption text-text-secondary">{marketStatus === 'LIVE' ? 'Live' : marketStatus === 'SIMULATED' ? 'Synthetic' : 'Checking'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Motion.div>

            </div>
          </div>
        </div>
      </Motion.div>
    </AppShell>
  );
}
