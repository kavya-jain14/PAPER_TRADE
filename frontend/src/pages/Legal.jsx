import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

export default function Legal() {
  const [activeTab, setActiveTab] = useState('privacy');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-screen bg-[#0a0a0a] text-white/90 font-inter overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="border-b border-white/10 pb-6">
            <h1 className="text-4xl font-black text-white tracking-tight">Legal & Privacy</h1>
            <p className="text-white/50 mt-2">Important information about your use of Paper Trade Elite.</p>
          </header>

          <div className="flex gap-4 mb-8">
            <button onClick={() => setActiveTab('privacy')} className={`px-6 py-2 rounded-xl font-bold transition-colors ${activeTab === 'privacy' ? 'bg-purple-500 text-white' : 'bg-[#121212] border border-white/10 text-white/50 hover:text-white'}`}>
              Privacy Policy
            </button>
            <button onClick={() => setActiveTab('terms')} className={`px-6 py-2 rounded-xl font-bold transition-colors ${activeTab === 'terms' ? 'bg-purple-500 text-white' : 'bg-[#121212] border border-white/10 text-white/50 hover:text-white'}`}>
              Terms of Use
            </button>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 prose prose-invert max-w-none">
            {activeTab === 'privacy' ? (
              <>
                <h2>Privacy Policy</h2>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you create or modify your account, use the interactive features of our services, or communicate with us. This includes your name, email address, and virtual trading history.</p>
                <h3>2. Use of Information</h3>
                <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect Paper Trade Elite and our users. We also use this information to offer you tailored content.</p>
                <h3>3. Sharing of Information</h3>
                <p>We do not share your personal information with third parties except as described in this privacy policy, such as with your consent or as necessary to provide the services you requested.</p>
                <h3>4. Security</h3>
                <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
              </>
            ) : (
              <>
                <h2>Terms of Use</h2>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h3>1. Acceptance of Terms</h3>
                <p>By accessing or using our services, you agree to be bound by these Terms of Use and all terms incorporated by reference.</p>
                <h3>2. Educational Purpose Only</h3>
                <p>Paper Trade Elite is a simulation platform designed strictly for educational purposes. <strong>It does not involve real money, and no actual financial transactions occur.</strong> The market data provided may be delayed or synthetically generated.</p>
                <h3>3. No Financial Advice</h3>
                <p>Any information or data provided on this platform does not constitute financial, investment, or trading advice. You are solely responsible for any real-world financial decisions you make outside of this platform.</p>
                <h3>4. Account Responsibilities</h3>
                <p>You are responsible for safeguarding your account credentials and for all activities that occur under your account.</p>
                <h3>5. Disclaimer of Warranties</h3>
                <p>The platform is provided on an "as is" and "as available" basis without any warranties of any kind.</p>
              </>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  );
}
