import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdhanPopupProps {
  prayerName: string;
  onClose: () => void;
}

export const AdhanPopup = ({ prayerName, onClose }: AdhanPopupProps) => {
  useEffect(() => {
    // Play notification sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
    
    // Auto close after 30 seconds
    const timer = setTimeout(onClose, 30000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
    >
      <div className="bg-brand-blue text-white rounded-3xl shadow-2xl p-6 border-4 border-brand-gold relative overflow-hidden">
        {/* Mosque Silhouette Background */}
        <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
          <svg width="150" height="100" viewBox="0 0 150 100" fill="currentColor">
            <path d="M0,100 L0,80 L20,60 L40,80 L60,40 L80,80 L100,60 L120,80 L140,60 L150,70 L150,100 Z" />
          </svg>
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-brand-gold p-3 rounded-2xl shadow-lg">
            <Bell className="w-6 h-6 text-brand-blue animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-brand-gold font-bold text-xs uppercase tracking-widest mb-1">Panggilan Sholat</h4>
            <h3 className="text-xl font-black mb-2">Waktu {prayerName} Telah Tiba</h3>
            <p className="text-sm text-brand-light/70 leading-snug">
              Mari sejenak berhenti untuk menunaikan ibadah sholat berjamaah di Masjid Al Ishlah.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex gap-3 relative z-10">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-brand-gold text-brand-blue font-bold rounded-xl shadow-lg hover:bg-brand-gold/90 transition-all active:scale-95"
          >
            Alhamdulillah
          </button>
        </div>
      </div>
    </motion.div>
  );
};
