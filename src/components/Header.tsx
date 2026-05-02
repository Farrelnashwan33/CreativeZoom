import { useEffect, useState } from 'react';
import { Clock, Moon, Sun, CloudMoon } from 'lucide-react';

export const Header = ({ roomId, onPrayerTime, isConnected }: { roomId: string; onPrayerTime?: (name: string) => void, isConnected?: boolean }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  const [prayerTimes] = useState({
    Subuh: '04:35',
    Dzuhur: '11:55',
    Ashar: '15:15',
    Maghrib: '17:55',
    Isya: '19:05'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setTime(timeStr);

      // Check for prayer time
      Object.entries(prayerTimes).forEach(([name, prayTime]) => {
        if (timeStr === prayTime && now.getSeconds() === 0) {
          onPrayerTime?.(name);
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onPrayerTime, prayerTimes]);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-brand-light px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <div>
          <h1 className="font-bold text-brand-blue text-lg leading-tight">Creative Zoom</h1>
          <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Masjid Al Ishlah</p>
        </div>
        <button 
          onClick={() => onPrayerTime?.('Test Adzan')}
          className="ml-2 px-2 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold rounded-lg border border-brand-gold/20 hover:bg-brand-gold hover:text-white transition-all"
        >
          Test Notif
        </button>
        <div className="h-8 w-px bg-brand-light mx-2 hidden md:block" />
        <div className="hidden md:flex items-center gap-2 bg-brand-light/50 px-3 py-1.5 rounded-lg border border-brand-light">
          <span className="text-[10px] font-bold text-brand-dark/40 uppercase">Room ID:</span>
          <span className="text-xs font-mono font-bold text-brand-blue">{roomId}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 animate-pulse'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
            {isConnected ? 'Terhubung' : 'Terputus'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-4 bg-brand-blue/5 px-4 py-2 rounded-2xl border border-brand-blue/10">
          {Object.entries(prayerTimes).map(([name, time]) => (
            <div key={name} className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-brand-dark/30 uppercase">{name}</span>
              <span className="text-xs font-bold text-brand-blue">{time}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-3 bg-brand-dark text-white px-4 py-2 rounded-2xl shadow-lg">
          <Clock className="w-4 h-4 text-brand-gold" />
          <span className="text-sm font-bold font-mono tracking-tighter">{time}</span>
        </div>
      </div>
    </header>
  );
};
