import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell } from '../components/AppShell';
import { PageHeader, Panel } from '../components/workspace/Workspace';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const session = useMarketSession();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState({ name: '', email: '', bio: '', avatar: '', balance: 0 });
  const [draft, setDraft] = useState({ name: '', bio: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const controller = new AbortController();
    fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Profile unavailable');
        const next = { name: data.name || 'Trader', email: data.email || '', bio: data.bio || '', avatar: data.avatar || '', balance: data.virtualBalance ?? data.balance ?? 0 };
        setProfile(next);
        setDraft({ name: next.name, bio: next.bio });
      }).catch((error) => { if (error.name !== 'AbortError') toast.error(error.message); });
    return () => controller.abort();
  }, [navigate, token]);

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 400 * 1024) { toast.error('Image must be under 400 KB'); return; }
    const reader = new FileReader();
    reader.onload = () => setProfile((value) => ({ ...value, avatar: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!draft.name.trim()) { toast.error('Display name is required'); return; }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ name: draft.name.trim(), bio: draft.bio.trim(), avatar: profile.avatar }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');
      setProfile((value) => ({ ...value, name: data.name, bio: data.bio, avatar: data.avatar ?? value.avatar }));
      setEditing(false);
      toast.success('Profile updated');
    } catch (error) { toast.error(error.message); } finally { setSaving(false); }
  };

  const signOut = async () => {
    try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { 'auth-token': token }, credentials: 'include' }); } catch { /* local sign-out still proceeds */ }
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppShell userName={profile.name} marketStatus={session.mode} avatar={profile.avatar}>
      <main className="workspace-page">
        <div className="workspace-page__inner" style={{ maxWidth: 1000 }}>
          <PageHeader title="Profile" description="Personal details used inside your paper-trading workspace." session={session} actions={<button className="desk-button" type="button" onClick={signOut}>Sign out</button>} />

          <div className="workspace-grid workspace-grid--two">
            <Panel title="Trader profile" actions={!editing && <button className="desk-button" type="button" onClick={() => setEditing(true)}>Edit</button>}>
              <div className="profile-editor">
                <div>
                  <button className="profile-avatar" type="button" onClick={() => fileRef.current?.click()} aria-label="Change profile image">
                    {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{(profile.name || 'T').charAt(0).toUpperCase()}</span>}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={chooseAvatar} hidden />
                  <p className="type-caption-muted" style={{ marginTop: 8 }}>Click image to replace · max 400 KB</p>
                </div>
                {editing ? <div style={{ display: 'grid', gap: 14 }}><label><span className="type-label" style={{ display: 'block', marginBottom: 6 }}>Display name</span><input className="desk-input" style={{ width: '100%' }} value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} maxLength={50} /></label><label><span className="type-label" style={{ display: 'block', marginBottom: 6 }}>Bio</span><textarea className="desk-input" style={{ width: '100%', height: 100, paddingTop: 10, resize: 'vertical' }} value={draft.bio} onChange={(event) => setDraft((value) => ({ ...value, bio: event.target.value }))} maxLength={200} /></label><div style={{ display: 'flex', gap: 8 }}><button className="desk-button desk-button--primary" type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button><button className="desk-button" type="button" onClick={() => { setDraft({ name: profile.name, bio: profile.bio }); setEditing(false); }}>Cancel</button></div></div> : <div><h2 style={{ margin: 0, fontSize: 'var(--text-h3)', fontWeight: 500 }}>{profile.name || 'Trader'}</h2><p style={{ margin: '5px 0 18px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)' }}>{profile.email}</p><p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{profile.bio || 'No profile note added.'}</p></div>}
              </div>
            </Panel>

            <Panel title="Account details">
              <dl className="account-details"><div><dt>Account type</dt><dd>Paper trader</dd></div><div><dt>Available balance</dt><dd>₹{Number(profile.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd></div><div><dt>Quote mode</dt><dd>{session.mode}</dd></div><div><dt>Exchange timezone</dt><dd>Asia/Kolkata</dd></div></dl>
            </Panel>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
