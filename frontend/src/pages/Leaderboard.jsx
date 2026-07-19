import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AppShell } from '../components/AppShell';
import useMarketStatus from '../hooks/useMarketStatus';
import Podium from '../components/Leaderboard/Podium';
import LeaderboardList from '../components/Leaderboard/LeaderboardList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Basic AppShell state
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const isMarketOpen = useMarketStatus();

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return navigate('/login');

    const fetchLeaderboard = async () => {
      try {
        const userRes = await fetch(`${API_URL}/api/auth/getuser`, { headers: { "Content-Type": "application/json", "auth-token": token } });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserName(userData.name ? userData.name.split(' ')[0] : 'Trader');
          setAvatar(userData.avatar || '');
        }

        const res = await fetch(`${API_URL}/api/leaderboard`, { headers: { "auth-token": token } });
        const data = await res.json();
        
        if (res.ok) {
          setLeaderboard(data.leaderboard);
          setCurrentUserRank(data.currentUser);
        } else {
          toast.error(data.message || 'Failed to fetch leaderboard');
        }
      } catch {
        toast.error('Network error while fetching leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token, navigate]);

  const top3 = leaderboard.slice(0, 3);
  const restOfUsers = leaderboard.slice(3);

  return (
    <AppShell userName={userName} isMarketOpen={isMarketOpen} avatar={avatar}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1000px] mx-auto space-y-12">
            
            <header className="text-center space-y-3 pb-8 border-b border-border">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center justify-center p-3 rounded-full bg-accent/10 text-accent mb-2">
                <span className="material-symbols-outlined text-4xl">social_leaderboard</span>
              </motion.div>
              <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="type-h1 bg-gradient-to-r from-accent to-accent-purple text-transparent bg-clip-text">
                Global Hall of Fame
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="type-body text-text-secondary max-w-2xl mx-auto">
                Compete against thousands of traders worldwide. Only the top 100 make the cut. Are you ready to claim your spot on the podium?
              </motion.p>
            </header>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <Podium topUsers={top3} />
                <LeaderboardList users={restOfUsers} />
              </>
            )}

          </div>
        </div>

        {/* Sticky User Rank Bar */}
        {!loading && currentUserRank && (
          <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-surface-overlay backdrop-blur-xl z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]"
          >
            <div className="max-w-[1000px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-accent/20 text-accent flex items-center justify-center font-bold font-mono">
                  #{currentUserRank.rank}
                </div>
                <div>
                  <div className="type-label-body text-text-primary">You</div>
                  <div className="type-caption-muted">Keep trading to climb the ranks!</div>
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-positive">
                ${currentUserRank.balance.toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
