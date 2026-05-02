'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Mail, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const InviteModal = ({ isOpen, onClose, roomId }: InviteModalProps) => {
  const [copied, setCopied] = useState(false);
  const meetingLink = typeof window !== 'undefined' ? `${window.location.origin}/meeting/${roomId}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Assalamualaikum, mari bergabung di meeting Creative Zoom Masjid Al Ishlah.\n\nRoom ID: ${roomId}\nLink: ${meetingLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Undangan Meeting Creative Zoom - Masjid Al Ishlah');
    const body = encodeURIComponent(`Assalamualaikum,\n\nAnda diundang untuk bergabung dalam meeting Creative Zoom.\n\nRoom ID: ${roomId}\nLink: ${meetingLink}\n\nTerima kasih.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-brand-light rounded-full transition-all text-brand-dark/40"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-brand-blue mb-2 flex items-center gap-2">
              <Share2 className="w-7 h-7 text-brand-gold" />
              Undang Peserta
            </h3>
            <p className="text-sm text-brand-dark/60 mb-6">Bagikan link meeting ini ke jamaah lain.</p>
            
            <div className="space-y-4">
              {/* Copy Link Section */}
              <div className="p-4 bg-brand-light rounded-2xl border border-brand-blue/5">
                <label className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest block mb-2">Link Meeting</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-mono text-brand-blue truncate">{meetingLink}</p>
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 bg-white rounded-lg shadow-sm hover:bg-brand-blue hover:text-white transition-all border border-brand-blue/10"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl transition-all group"
                >
                  <div className="p-3 bg-green-500 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-green-700">WhatsApp</span>
                </button>

                <button 
                  onClick={handleEmailShare}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-all group"
                >
                  <div className="p-3 bg-brand-blue text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-brand-blue">Email</span>
                </button>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 text-brand-dark/40 font-bold hover:text-brand-dark transition-colors"
              >
                Selesai
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
