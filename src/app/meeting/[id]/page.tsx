'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Chat } from '@/components/Chat';
import { Whiteboard } from '@/components/Whiteboard';
import { Header } from '@/components/Header';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  PhoneOff, MessageSquare, Edit3, Users, 
  Settings, Shield, Clock, AlertCircle,
  Hand, ShieldAlert, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InviteModal } from '@/components/InviteModal';

import { AdhanPopup } from '@/components/AdhanPopup';

export default function MeetingRoom() {
  const { id: roomId } = useParams() as { id: string };
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (!storedName) {
      router.push('/');
    } else {
      setUserName(storedName);
    }
  }, [router]);

  const { 
    peers, myStream, socket, isHost, whiteboardActive, timer, toggleScreenShare 
  } = useWebRTC(roomId, userName);

  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [activePrayer, setActivePrayer] = useState<string | null>(null);

  const handleScreenShare = () => {
    toggleScreenShare();
    setIsScreenSharing(!isScreenSharing);
  };
  const [showHostModal, setShowHostModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [durationInput, setDurationInput] = useState('30');

  const startMeetingTimer = () => {
    socket?.emit('start-timer', { roomId, duration: parseInt(durationInput) });
    setShowHostModal(false);
  };

  const endMeeting = () => {
    if (confirm('Akhiri meeting untuk semua peserta?')) {
      socket?.emit('end-meeting', roomId);
    }
  };

  useEffect(() => {
    if (timer) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        const remaining = timer.duration * 60 - elapsed;
        if (remaining <= 0) {
          setTimeLeft('WAKTU HABIS');
          clearInterval(interval);
          if (isHost) {
            socket?.emit('end-meeting', roomId);
          }
        } else {
          const m = Math.floor(remaining / 60);
          const s = remaining % 60;
          setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const toggleMic = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach(track => track.enabled = !micActive);
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks().forEach(track => track.enabled = !videoActive);
      setVideoActive(!videoActive);
    }
  };

  const [messages, setMessages] = useState<{ userName: string; message: string; time: string; userId: string }[]>([]);
  const [raisedHands, setRaisedHands] = useState<{ [userId: string]: boolean }>({});
  const [blurredParticipants, setBlurredParticipants] = useState<{ [userId: string]: boolean }>({});
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isCameraBlurred, setIsCameraBlurred] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: { userName: string; message: string; time: string; userId: string }) => {
      setMessages((prev) => {
        const exists = prev.some(m => m.message === msg.message && m.time === msg.time && m.userId === msg.userId);
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    const handleRaiseHand = ({ userId, raised }: { userId: string, raised: boolean }) => {
      if (raised && userId !== socket?.id) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
      setRaisedHands(prev => ({ ...prev, [userId]: raised }));
    };

    const handleCameraBlur = ({ userId, blurred }: { userId: string, blurred: boolean }) => {
      setBlurredParticipants(prev => ({ ...prev, [userId]: blurred }));
    };

    socket.on('receive-message', handleMessage);
    socket.on('user-raised-hand', handleRaiseHand);
    socket.on('user-camera-blurred', handleCameraBlur);
    return () => {
      socket.off('receive-message', handleMessage);
      socket.off('user-raised-hand', handleRaiseHand);
      socket.off('user-camera-blurred', handleCameraBlur);
    };
  }, [socket]);

  const toggleRaiseHand = () => {
    const newState = !isHandRaised;
    if (newState) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
    setIsHandRaised(newState);
    socket?.emit('raise-hand', { roomId, raised: newState });
    setRaisedHands(prev => ({ ...prev, [socket?.id || 'me']: newState }));
  };

  const toggleBlur = () => {
    const newState = !isCameraBlurred;
    setIsCameraBlurred(newState);
    socket?.emit('camera-blurred', { roomId, blurred: newState });
    setBlurredParticipants(prev => ({ ...prev, [socket?.id || 'me']: newState }));
  };

  const handleSendMessage = (msg: string) => {
    if (!socket || !roomId) return;
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      userName,
      message: msg,
      time,
      userId: socket.id || 'me'
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    
    socket.emit('send-message', { roomId, message: msg, userName });
  };

  const toggleWhiteboard = () => {
    if (isHost) {
      socket?.emit('toggle-whiteboard', { roomId, active: !whiteboardActive });
    }
  };

  const handleLeave = () => {
    if (confirm('Apakah Anda yakin ingin meninggalkan meeting?')) {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      router.push('/');
    }
  };

  if (!userName) return null;

  return (
    <div className="flex flex-col h-screen bg-brand-light font-sans">
      <Header roomId={roomId} isConnected={isConnected} onPrayerTime={(name) => setActivePrayer(name)} />

      <main className="flex-1 flex overflow-hidden relative p-4 gap-4">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Timer Warning */}
          {timeLeft && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-brand-gold/10 border border-brand-gold/20 px-6 py-2 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-brand-gold animate-pulse" />
                <span className="text-sm font-bold text-brand-dark">Durasi Tersisa:</span>
              </div>
              <span className={`text-lg font-mono font-black ${timeLeft.includes('05:') ? 'text-red-500' : 'text-brand-blue'}`}>
                {timeLeft}
              </span>
            </motion.div>
          )}

          {/* Video Grid / Whiteboard */}
          <div className="flex-1 relative rounded-3xl overflow-hidden shadow-inner">
            {whiteboardActive ? (
              <Whiteboard socket={socket} roomId={roomId} isHost={isHost} />
            ) : (
              <div className="video-grid p-2">
                {myStream && (
                  <VideoPlayer 
                    stream={myStream} 
                    userName={`${userName} (Anda)`} 
                    muted 
                    isBlurred={isCameraBlurred}
                    raisedHand={isHandRaised}
                    isLocal={true}
                  />
                )}
                {peers.map((peer) => (
                  <VideoPlayer 
                    key={peer.peerId} 
                    stream={peer.stream!} 
                    userName={peer.userName} 
                    raisedHand={raisedHands[peer.peerId]}
                    isBlurred={blurredParticipants[peer.peerId]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 md:w-96 flex-shrink-0 h-full"
            >
              <Chat 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                currentUserId={socket?.id || ''} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Control Bar */}
      <div className="bg-white/95 backdrop-blur-md border-t border-brand-light p-6 flex items-center justify-center relative shadow-2xl">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={toggleMic}
            className={`control-btn ${micActive ? 'control-btn-active' : 'control-btn-inactive'}`}
          >
            {micActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`control-btn ${videoActive ? 'control-btn-active' : 'control-btn-inactive'}`}
          >
            {videoActive ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <div className="h-10 w-px bg-brand-light mx-2" />

          <button 
            onClick={handleScreenShare}
            className={`control-btn ${isScreenSharing ? 'bg-green-500 text-white' : 'bg-brand-light text-brand-dark hover:bg-brand-blue hover:text-white'}`}
          >
            <ScreenShare className="w-6 h-6" />
          </button>

          <button 
            onClick={toggleBlur}
            className={`control-btn ${isCameraBlurred ? 'bg-purple-600 text-white shadow-lg' : 'bg-brand-light text-brand-dark'}`}
            title="Portrait Mode (Blur Background)"
          >
            <ShieldAlert className="w-6 h-6" />
          </button>

          <button 
            onClick={toggleRaiseHand}
            className={`control-btn ${isHandRaised ? 'bg-brand-gold text-brand-blue shadow-lg animate-pulse' : 'bg-brand-light text-brand-dark'}`}
            title="Angkat Tangan"
          >
            <Hand className="w-6 h-6" />
          </button>

          {isHost && (
            <>
              <button 
                onClick={() => setShowHostModal(true)}
                className="control-btn bg-brand-gold text-white"
              >
                <Settings className="w-6 h-6" />
              </button>
              <button 
                onClick={toggleWhiteboard}
                className={`control-btn ${whiteboardActive ? 'bg-brand-gold text-white shadow-brand-gold/20' : 'bg-brand-light text-brand-dark'}`}
              >
                <Edit3 className="w-6 h-6" />
              </button>
            </>
          )}

          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className={`control-btn ${chatOpen ? 'bg-brand-blue text-white' : 'bg-brand-light text-brand-dark'}`}
          >
            <MessageSquare className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setShowInviteModal(true)}
            className="control-btn bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white"
            title="Undang Orang"
          >
            <UserPlus className="w-6 h-6" />
          </button>

          <div className="h-10 w-px bg-brand-light mx-2" />

          <button 
            onClick={handleLeave}
            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-red-500/20 transition-all active:scale-95"
          >
            <PhoneOff className="w-6 h-6" />
            <span className="hidden md:block">Tinggalkan</span>
          </button>
        </div>

        {/* Participant Count */}
        <div className="absolute right-8 hidden xl:flex items-center gap-3 bg-brand-blue/5 px-4 py-2 rounded-2xl border border-brand-blue/10">
          <Users className="w-5 h-5 text-brand-blue" />
          <span className="text-sm font-bold text-brand-blue">{peers.length + 1} Peserta</span>
        </div>
      </div>

      {/* Host Modal */}
      <AnimatePresence>
        {showHostModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-brand-blue mb-6 flex items-center gap-2">
                <Shield className="w-7 h-7 text-brand-gold" />
                Kontrol Host
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-brand-dark/60 ml-1">Durasi Meeting (Menit)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['15', '30', '60'].map(d => (
                      <button 
                        key={d}
                        onClick={() => setDurationInput(d)}
                        className={`py-3 rounded-xl font-bold transition-all ${durationInput === d ? 'bg-brand-blue text-white shadow-lg' : 'bg-brand-light text-brand-dark'}`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button 
                    onClick={startMeetingTimer}
                    className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold shadow-xl shadow-brand-blue/20"
                  >
                    Mulai Timer
                  </button>
                  <button 
                    onClick={() => {
                      socket?.emit('mute-all', { roomId });
                      setShowHostModal(false);
                    }}
                    className="w-full py-4 bg-red-100 text-red-600 rounded-xl font-bold"
                  >
                    Mute Semua Peserta
                  </button>
                  <button 
                    onClick={endMeeting}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-xl shadow-red-500/20"
                  >
                    Akhiri Meeting (Semua)
                  </button>
                  <button 
                    onClick={() => setShowHostModal(false)}
                    className="w-full py-3 text-brand-dark/40 font-bold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activePrayer && (
          <AdhanPopup 
            prayerName={activePrayer} 
            onClose={() => setActivePrayer(null)} 
          />
        )}
      </AnimatePresence>
      <InviteModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        roomId={roomId} 
      />
    </div>
  );
}
