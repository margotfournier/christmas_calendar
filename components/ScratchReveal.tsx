import React, { useState, useRef, useEffect } from 'react';

interface ScratchRevealProps {
  onReveal: () => void;
  isUnlocked: boolean; // Si la case est disponible (date passée ou présente)
  isOpened: boolean;   // Si l'utilisateur a déjà cliqué pour l'ouvrir
  isToday: boolean;    // Si c'est la case spécifique du jour
  children: React.ReactNode;
}

const ScratchReveal: React.FC<ScratchRevealProps> = ({ onReveal, isUnlocked, isOpened, isToday, children }) => {
  const [localOpened, setLocalOpened] = useState(isOpened);
  const [isScratching, setIsScratching] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScratchingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Seuil de révélation (30% de la surface grattée)
  const REVEAL_THRESHOLD = 30;

  // Initialiser le canvas
  const initCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || isInitializedRef.current) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Définir la taille du canvas
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Remplir avec la couche de grattage (argenté/métallique)
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Ajouter un motif texturé pour l'effet ticket à gratter
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.3)');
    gradient.addColorStop(1, 'rgba(150, 150, 150, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Ajouter du texte "Grattez ici" en petit
    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Grattez ici', rect.width / 2, rect.height / 2);

    isInitializedRef.current = true;
  };

  // Fonction pour calculer le pourcentage gratté
  const calculateScratchedPercentage = (): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const totalPixels = canvas.width * canvas.height;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) { // Alpha < 128 (transparent)
        transparentPixels++;
      }
    }

    return (transparentPixels / totalPixels) * 100;
  };

  // Fonction pour gratter
  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Vérifier le pourcentage gratté périodiquement (pas à chaque scratch pour performance)
    if (Math.random() < 0.1) { // 10% de chance de vérifier
      const percentage = calculateScratchedPercentage();
      if (percentage >= REVEAL_THRESHOLD && !localOpened) {
        setLocalOpened(true);
        onReveal();
        isScratchingRef.current = false;
        setIsScratching(false);
        // Effacer complètement le canvas après un court délai
        setTimeout(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 300);
      }
    }
  };

  useEffect(() => {
    if (localOpened || !isUnlocked) {
      isInitializedRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Initialiser le canvas
    initCanvas();

    // Gestionnaires d'événements
    const getEventPos = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const rect = container.getBoundingClientRect();
      if ('touches' in e && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      } else if (!('touches' in e)) {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
      return null;
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!isUnlocked || localOpened) return;
      e.preventDefault();
      e.stopPropagation();
      isScratchingRef.current = true;
      setIsScratching(true);
      const pos = getEventPos(e);
      if (pos) {
        scratch(pos.x, pos.y);
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isScratchingRef.current || !isUnlocked || localOpened) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getEventPos(e);
      if (pos) {
        scratch(pos.x, pos.y);
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isScratchingRef.current = false;
      setIsScratching(false);
    };

    // Ajouter les écouteurs d'événements sur le canvas
    canvas.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isUnlocked, localOpened, onReveal]);

  // Réinitialiser quand le composant change d'état
  useEffect(() => {
    if (localOpened) {
      isInitializedRef.current = false;
    }
  }, [localOpened]);

  return (
    <div className="relative w-full">
      {/* Indice "Grattez pour révéler" uniquement sur la date du jour - en dehors du overflow-hidden */}
      {isToday && isUnlocked && !localOpened && !isScratching && (
        <div className="absolute -top-10 left-0 right-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 shadow-lg border-2 border-blue-200/50">
            Grattez
          </span>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className={`relative w-full aspect-square rounded-[2rem] overflow-hidden transition-all duration-500 
          ${isUnlocked && !localOpened ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
          ${localOpened ? 'bg-white/40 shadow-inner' : 'glass'}
        `}
      >
        {/* Contenu Révélé */}
        <div className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-700 z-0
          ${localOpened ? 'scale-100 opacity-100 blur-0' : 'scale-90 opacity-0 blur-xl pointer-events-none'}
        `}>
          {children}
        </div>

        {/* Canvas de grattage */}
        {isUnlocked && !localOpened && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-20 touch-none rounded-[2rem]"
            style={{ 
              cursor: isScratching ? 'grabbing' : 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          />
        )}

        {/* Couche de fond pour les jours non disponibles */}
        {!isUnlocked && (
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-100/40 to-slate-200/40 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-300/30" />
          </div>
        )}

        {/* Indice subtil pour les jours passés non ouverts */}
        {!isToday && isUnlocked && !localOpened && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-blue-400/30 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScratchReveal;
