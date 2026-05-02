'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Users, Sparkles, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleCreateMeeting = () => {
    if (!name) return alert('Silakan masukkan nama Anda');
    const newRoomId = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('userName', name);
    router.push(`/meeting/${newRoomId}`);
  };

  const handleJoinMeeting = () => {
    if (!name || !roomId) return alert('Silakan masukkan nama dan ID Meeting');
    localStorage.setItem('userName', name);
    router.push(`/meeting/${roomId}`);
  };

  return (
    <main className="min-h-screen bg-mosque flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-brand-blue p-8 flex flex-col items-center text-white">
          <div className="bg-white p-3 rounded-2xl mb-4 shadow-lg">
            <img src="/logo.png" alt="Creative Zoom Logo" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Creative Zoom</h1>
          <p className="text-brand-light/80 mt-1 font-medium italic text-sm">
            "Connect • Collaborate • Inspire"
          </p>
          <div className="mt-4 px-4 py-1 bg-brand-gold/20 rounded-full border border-brand-gold/30 text-brand-gold text-xs font-semibold">
            Masjid Al Ishlah Edition
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-dark/70 ml-1">Nama Anda</label>
            <input 
              type="text" 
              placeholder="Masukkan nama lengkap" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-brand-light focus:border-brand-blue focus:ring-0 transition-all outline-none text-brand-dark font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateMeeting()}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleCreateMeeting}
              className="w-full py-4 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl font-bold text-lg shadow-xl shadow-brand-blue/20 transition-all flex items-center justify-center gap-2 group"
            >
              <Video className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Mulai Meeting Baru
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-light"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-brand-dark/40 font-bold tracking-widest">Atau Gabung</span>
              </div>
            </div>

            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Masukkan ID Meeting" 
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-brand-light focus:border-brand-blue transition-all outline-none text-brand-dark font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
              />
              <button 
                onClick={handleJoinMeeting}
                className="w-full py-4 bg-white hover:bg-brand-light text-brand-blue border-2 border-brand-blue rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-6 h-6" />
                Gabung Sekarang
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 flex justify-center gap-6 text-brand-dark/30">
          <Sparkles className="w-5 h-5" />
          <MessageSquare className="w-5 h-5" />
          <Users className="w-5 h-5" />
        </div>
      </motion.div>

      <footer className="mt-8 text-white/60 text-sm font-medium">
        &copy; 2026 Creative Zoom - Masjid Al Ishlah
      </footer>
    </main>
  );
}
