import { useState, useRef, useEffect } from 'react';
import { Send, User, MessageCircle } from 'lucide-react';

interface ChatProps {
  messages: { userName: string; message: string; time: string; userId: string }[];
  onSendMessage: (msg: string) => void;
  currentUserId: string;
}

export const Chat = ({ messages, onSendMessage, currentUserId }: ChatProps) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-brand-light shadow-2xl">
      <div className="p-6 border-b border-brand-light bg-brand-blue/5 flex items-center justify-between">
        <h3 className="font-bold text-brand-blue flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Obrolan Realtime
        </h3>
        <span className="text-[10px] bg-brand-blue text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider">
          {messages.length} Pesan
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.userId === currentUserId ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-tighter">
                {msg.userName}
              </span>
              <span className="text-[10px] text-brand-dark/20">{msg.time}</span>
            </div>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
              msg.userId === currentUserId 
                ? 'bg-brand-blue text-white rounded-tr-none' 
                : 'bg-brand-light text-brand-dark rounded-tl-none'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-brand-light bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="w-full pl-4 pr-12 py-3 bg-brand-light rounded-xl border-none focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all text-brand-dark font-medium placeholder:text-brand-dark/30"
          />
          <button
            type="submit"
            className="absolute right-2 p-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-all shadow-md shadow-brand-blue/20 active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
