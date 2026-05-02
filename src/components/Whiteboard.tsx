import { useRef, useEffect, useState } from 'react';
import { Pencil, Eraser, Trash2, Maximize2, Minimize2, Circle } from 'lucide-react';

interface WhiteboardProps {
  socket: any;
  roomId: string;
  isHost: boolean;
}

export const Whiteboard = ({ socket, roomId, isHost }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1E3A8A');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    socket.on('draw', ({ x, y, prevX, prevY, color, width }: any) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    socket.on('clear-whiteboard', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => window.removeEventListener('resize', resize);
  }, [socket]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    if (lastPos.current) {
      const drawData = {
        x,
        y,
        prevX: lastPos.current.x,
        prevY: lastPos.current.y,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        width: tool === 'eraser' ? 20 : 3
      };
      
      ctx.strokeStyle = drawData.color;
      ctx.lineWidth = drawData.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(drawData.prevX, drawData.prevY);
      ctx.lineTo(drawData.x, drawData.y);
      ctx.stroke();

      socket.emit('draw', { roomId, drawData });
    }
    lastPos.current = { x, y };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-whiteboard', roomId);
  };

  const colors = ['#1E3A8A', '#D4AF37', '#EF4444', '#10B981', '#000000'];

  return (
    <div className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-brand-blue/10 ${isFullscreen ? 'fixed inset-4 z-50' : 'w-full h-full'}`}>
      <div className="bg-brand-blue p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            <button 
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg transition-all ${tool === 'pen' ? 'bg-white text-brand-blue shadow-lg' : 'hover:bg-white/10'}`}
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition-all ${tool === 'eraser' ? 'bg-white text-brand-blue shadow-lg' : 'hover:bg-white/10'}`}
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>
          
          <div className="h-8 w-px bg-white/20 mx-2" />
          
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button 
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-125 ${color === c && tool === 'pen' ? 'border-white ring-2 ring-white/50' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={clearCanvas}
            className="p-2 hover:bg-red-500 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
          >
            <Trash2 className="w-5 h-5" />
            Bersihkan
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="flex-1 cursor-crosshair touch-none"
      />
    </div>
  );
};
