import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Hand } from 'lucide-react';

export const VideoPlayer = ({ 
  stream, 
  userName, 
  muted = false, 
  isBlurred = false,
  raisedHand = false,
  isLocal = false
}: { 
  stream: MediaStream; 
  userName: string; 
  muted?: boolean; 
  isBlurred?: boolean;
  raisedHand?: boolean;
  isLocal?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmentationRef = useRef<any>(null);
  const requestRef = useRef<number>(null);
  const [objectFit, setObjectFit] = useState<'cover' | 'contain'>('cover');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    let isActive = true;

    let segmentation: any = null;

    const initSegmentation = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { SelfieSegmentation } = await import('@mediapipe/selfie_segmentation');
        
        const selfieSegmentation = new SelfieSegmentation({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        if (!isActive) {
          selfieSegmentation.close();
          return;
        }

        segmentation = selfieSegmentation;
        segmentationRef.current = selfieSegmentation;

        selfieSegmentation.setOptions({
          modelSelection: 1, // 1 is landscape/meeting mode
          selfieMode: false,
        });

        selfieSegmentation.onResults((results: any) => {
          if (!isActive || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Set canvas dimensions to match video results
          if (canvas.width !== results.image.width || canvas.height !== results.image.height) {
            canvas.width = results.image.width;
            canvas.height = results.image.height;
          }

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 1. Draw the mask onto the canvas
          ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

          // 2. Use 'source-in' to keep only the person from the original image
          ctx.globalCompositeOperation = 'source-in';
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          // 3. Use 'destination-over' to draw the blurred background behind the person
          ctx.globalCompositeOperation = 'destination-over';
          ctx.filter = 'blur(15px) brightness(0.9)'; // Added brightness adjustment for depth
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          
          ctx.restore();
        });

        const processFrame = async () => {
          if (!isActive || !videoRef.current || !isBlurred) return;
          
          if (videoRef.current.readyState >= 2) {
            try {
              await selfieSegmentation.send({ image: videoRef.current });
            } catch (e) {
              console.error("Segmentation send error:", e);
            }
          }
          
          if (isActive && isBlurred) {
            requestRef.current = requestAnimationFrame(processFrame);
          }
        };

        if (isBlurred) {
          processFrame();
        }
      } catch (error) {
        console.error('Failed to initialize segmentation:', error);
      }
    };

    if (isBlurred) {
      initSegmentation();
    } else {
      // Clear canvas if blur is disabled
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      isActive = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (segmentation) {
        try {
          segmentation.close();
        } catch (e) {
          // Ignore "already deleted" errors during cleanup
        }
      }
      segmentationRef.current = null;
    };
  }, [isBlurred, stream]);

  return (
    <div className={`relative group rounded-2xl overflow-hidden bg-brand-dark shadow-xl aspect-video border-2 transition-all ${raisedHand ? 'border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'border-brand-light/10'}`}>
      <div className="relative w-full h-full">
        {/* Main Video Element (visible when not blurred) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full transition-opacity duration-300 ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${isBlurred ? 'opacity-0' : 'opacity-100'} ${isLocal ? '-scale-x-100' : ''}`}
        />
        
        {/* Canvas for Segmentation (visible when blurred) */}
        <canvas 
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${isBlurred ? 'opacity-100' : 'opacity-0'} ${isLocal ? '-scale-x-100' : ''}`}
        />
      </div>
      
      {isLocal && (
        <button 
          onClick={() => setObjectFit(prev => prev === 'cover' ? 'contain' : 'cover')}
          className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/60"
          title={objectFit === 'cover' ? 'Switch to Fit Mode' : 'Switch to Fill Mode'}
        >
          {objectFit === 'cover' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}
      
      {raisedHand && (
        <div className="absolute top-4 right-4 bg-brand-gold text-brand-blue p-2 rounded-xl shadow-lg animate-bounce z-10">
          <Hand className="w-6 h-6" fill="currentColor" />
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-white text-xs font-bold tracking-wide uppercase">{userName}</span>
      </div>
    </div>
  );
};
