import React, { useState, useRef, useEffect } from 'react';

interface ScratchRevealProps {
  onReveal: () => void;
  isUnlocked: boolean; // Si la case est disponible (date passée ou présente)
  isOpened: boolean;   // Si l'utilisateur a déjà cliqué pour l'ouvrir
  isScratchable: boolean; // Si cette case doit proposer l'effet grattable
  isToday: boolean;    // Si c'est la case spécifique du jour
  day: number;         // Numéro du jour pour déterminer la couleur de ciel
  startOffset: number; // Offset du calendrier pour calculer la ligne
  children: React.ReactNode;
}

const ScratchReveal: React.FC<ScratchRevealProps> = ({ onReveal, isUnlocked, isOpened, isScratchable, isToday, day, startOffset, children }) => {
  // Calculer la ligne du calendrier (0-indexed) pour que toutes les cases d'une même ligne aient la même couleur
  const calendarRow = Math.floor((startOffset + day - 1) / 7);
  // Convertir la ligne en semaine (1-indexed) pour correspondre à la logique de WinterIllustration
  const week = calendarRow + 1;
  
  const getSkyGradient = () => {
    if (week === 1 || week === 5) {
      // Nuit
      return 'linear-gradient(to bottom, #1a1c2c, #3b5e8c)';
    } else if (week === 2) {
      // Aube
      return 'linear-gradient(to bottom, #ff9a9e, #fecfef)';
    } else if (week === 3) {
      // Midi
      return 'linear-gradient(to bottom, #4a90e2, #87ceeb)';
    } else if (week === 4) {
      // Coucher de soleil
      return 'linear-gradient(to bottom, #a1c4fd 0%, #dcd6f7 20%, #ffb7b7 45%, #ffcc33 75%, #f48fb1 100%)';
    } else {
      // Jour
      return 'linear-gradient(to bottom, #a1c4fd, #c2e9fb)';
    }
  };
  
  const skyGradient = getSkyGradient();
  const [localOpened, setLocalOpened] = useState(isOpened);
  const [isScratching, setIsScratching] = useState(false);
  const [showWowEffect, setShowWowEffect] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScratchingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isInteractive = isUnlocked && !localOpened && isScratchable;

  useEffect(() => {
    setLocalOpened(isOpened);
  }, [isOpened]);

  // Seuil de révélation (60% de la surface grattée - nécessite plus de grattage)
  const REVEAL_THRESHOLD = 80;

  // Audio feedback removed as requested (no frequencies played).

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

    // Couche de grattage subtile (blanc/givre) sur fond de ciel coloré
    // Couche blanche semi-transparente pour créer l'effet de grattage
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Ajouter une texture subtile de givre
    const frostGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    frostGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    frostGradient.addColorStop(0.5, 'rgba(240, 240, 240, 0.3)');
    frostGradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
    ctx.fillStyle = frostGradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Dessiner des 'taches' de givre plus larges pour que la texture soit bien visible sur de grandes cases
    const frostCount = Math.max(12, Math.floor((rect.width * rect.height) / 18000));
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < frostCount; i++) {
      const fx = Math.random() * rect.width;
      const fy = Math.random() * rect.height;
      const radius = 6 + Math.random() * Math.min(rect.width, rect.height) * 0.06; // taches plus grandes
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.12})`;
      ctx.filter = `blur(${2 + Math.random() * 4}px)`;
      ctx.arc(fx, fy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.restore();

    isInitializedRef.current = true;
  };

  // small festive chime: short arpeggio using WebAudio
  const playFestiveChime = () => {
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // quick C major arpeggio (C5, E5, G5)
      const baseGain = ctx.createGain();
      baseGain.gain.value = 0.0001; // start near 0 to avoid click
      baseGain.connect(ctx.destination);

      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        osc.connect(g);
        g.connect(baseGain);
        const t0 = now + i * 0.07;
        const dur = 0.28;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      });

      // ramp master gain to audible and then fade
      baseGain.gain.cancelScheduledValues(now);
      baseGain.gain.setValueAtTime(0.0001, now);
      baseGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      baseGain.gain.linearRampToValueAtTime(0.0001, now + 0.9);

      // close context after a short time to free resources
      setTimeout(() => {
        try { ctx.close(); } catch (e) { /* ignore */ }
      }, 1200);
    } catch (e) {
      // ignore audio errors
      if ((import.meta as any).env?.DEV) console.debug('audio not available');
    }
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
    ctx.arc(x, y, 25, 0, Math.PI * 2); // Rayon légèrement réduit pour un grattage plus précis
    ctx.fill();

    // Vérifier le pourcentage gratté périodiquement (pas à chaque scratch pour performance)
    if (Math.random() < 0.15) { // 15% de chance de vérifier (plus fréquent pour meilleure réactivité)
      const percentage = calculateScratchedPercentage();
        if (percentage >= REVEAL_THRESHOLD && !localOpened) {
        // Déclencher l'effet wahou !
        setShowWowEffect(true);
        setLocalOpened(true);
        onReveal();
        isScratchingRef.current = false;
        setIsScratching(false);
        
        // play a short festive chime on reveal
        try {
          playFestiveChime();
        } catch (e) {
          // ignore
        }
        
        // Arrêter l'effet après l'animation
        setTimeout(() => {
          setShowWowEffect(false);
        }, 2000);
        
        // Effacer complètement le canvas après un court délai
        setTimeout(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 300);
      }
    }
  };

  useEffect(() => {
    if (!isInteractive) {
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
      if (!isInteractive) return;
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
      if (!isScratchingRef.current || !isInteractive) return;
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
  }, [isInteractive, onReveal]);

  // Réinitialiser quand le composant change d'état
  useEffect(() => {
    if (localOpened) {
      isInitializedRef.current = false;
    }
  }, [localOpened]);

  return (
    <div className="relative w-full">
      {/* Indice "Grattez pour révéler" uniquement sur la date du jour - en dehors du overflow-hidden */}
      {isScratchable && !localOpened && !isScratching && (
        <div className="absolute -top-10 left-0 right-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 shadow-lg border-2 border-blue-200/50">
            Scratch
          </span>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className={`relative w-full aspect-square rounded-[2rem] overflow-hidden transition-all duration-500 
          ${isUnlocked && !localOpened ? 'cursor-grab active:cursor-grabbing border-2 border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-white/80 hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] animate-[pulse-border_2s_ease-in-out_infinite]' : 'cursor-default border border-slate-100'}
        `}
        style={isUnlocked ? { background: skyGradient } : {}}
      >
        {/* Indicateur visuel pour les cases ouvrables - brillance subtile */}
        {isInteractive && (
          <div className="absolute inset-0 z-15 pointer-events-none rounded-[2rem] opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[2rem] animate-[shimmer_3s_ease-in-out_infinite]" />
          </div>
        )}
        {/* Contenu Révélé */}
        <div className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-700 z-0
          ${localOpened ? 'scale-100 opacity-100 blur-0' : 'scale-90 opacity-0 blur-xl pointer-events-none'}
          ${showWowEffect ? 'animate-[apple-reveal_1.2s_cubic-bezier(0.4,0,0.2,1)]' : ''}
        `}>
          {children}
        </div>

        {/* Effet Wahou - Ultra Premium & Élégant */}
        {showWowEffect && (
          <>
            <style>{`
              @keyframes elegant-particle {
                0% {
                  transform: translate(-50%, -50%) translate(0, 0) scale(0) rotate(0deg);
                  opacity: 0;
                }
                8% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translate(0, 0) scale(1.2) rotate(0deg);
                }
                15% {
                  transform: translate(-50%, -50%) translate(calc(var(--x) * 0.2), calc(var(--y) * 0.2)) scale(1) rotate(45deg);
                }
                100% {
                  transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0.2) rotate(1080deg);
                  opacity: 0;
                }
              }
              @keyframes elegant-sparkle {
                0% {
                  transform: translate(-50%, -50%) scale(0) rotate(0deg);
                  opacity: 0;
                  filter: brightness(1) blur(0px);
                }
                15% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translate(calc(var(--x) * 0.3), calc(var(--y) * 0.3)) scale(1.3) rotate(60deg);
                  filter: brightness(1.5) blur(0px);
                }
                40% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translate(calc(var(--x) * 0.7), calc(var(--y) * 0.7)) scale(1) rotate(180deg);
                  filter: brightness(1.2) blur(1px);
                }
                70% {
                  opacity: 0.8;
                  transform: translate(-50%, -50%) translate(calc(var(--x) * 1.2), calc(var(--y) * 1.2)) scale(0.6) rotate(300deg);
                  filter: brightness(1) blur(2px);
                }
                100% {
                  transform: translate(-50%, -50%) translate(calc(var(--x) * 1.6), calc(var(--y) * 1.6)) scale(0) rotate(360deg);
                  opacity: 0;
                  filter: brightness(0.8) blur(3px);
                }
              }
              @keyframes elegant-bloom {
                0% {
                  opacity: 0;
                  transform: scale(0.7);
                  filter: blur(0px) brightness(1);
                }
                25% {
                  opacity: 0.9;
                  transform: scale(1);
                  filter: blur(15px) brightness(1.2);
                }
                50% {
                  opacity: 1;
                  transform: scale(1.15);
                  filter: blur(25px) brightness(1.3);
                }
                75% {
                  opacity: 0.7;
                  transform: scale(1.25);
                  filter: blur(35px) brightness(1.1);
                }
                100% {
                  opacity: 0;
                  transform: scale(1.4);
                  filter: blur(50px) brightness(0.9);
                }
              }
              @keyframes elegant-glow {
                0%, 100% {
                  opacity: 0;
                  transform: scale(0.95);
                  border-color: rgba(255, 255, 255, 0);
                }
                30% {
                  opacity: 0.4;
                  transform: scale(1);
                  border-color: rgba(255, 255, 255, 0.15);
                }
                60% {
                  opacity: 0.7;
                  transform: scale(1.05);
                  border-color: rgba(255, 255, 255, 0.25);
                }
                100% {
                  opacity: 0.3;
                  transform: scale(1.1);
                  border-color: rgba(255, 255, 255, 0.1);
                }
              }
              @keyframes elegant-shimmer {
                0% {
                  transform: translateX(-100%) translateY(-100%) rotate(45deg);
                  opacity: 0;
                }
                50% {
                  opacity: 0.6;
                }
                100% {
                  transform: translateX(200%) translateY(200%) rotate(45deg);
                  opacity: 0;
                }
              }
            `}</style>
            <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-[2rem]">
              {/* Couche de lumière principale - bloom ultra-doux */}
              <div 
                className="absolute inset-0 rounded-[2rem]"
                style={{
                  background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.7) 0%, rgba(255, 240, 180, 0.4) 25%, rgba(255, 220, 120, 0.2) 50%, transparent 75%)',
                  animation: 'elegant-bloom 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                  filter: 'blur(25px)',
                }}
              />
              
              {/* Couche de lumière secondaire - plus subtile */}
              <div 
                className="absolute inset-0 rounded-[2rem]"
                style={{
                  background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0%, rgba(200, 220, 255, 0.2) 40%, transparent 70%)',
                  animation: 'elegant-bloom 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards',
                  filter: 'blur(30px)',
                }}
              />
              
              {/* Shimmer élégant qui traverse */}
              <div 
                className="absolute inset-0 rounded-[2rem]"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                  animation: 'elegant-shimmer 2s ease-in-out 0.5s',
                }}
              />
              
              {/* Anneaux de lumière concentriques ultra-subtils */}
              {[1, 2, 3, 4].map((ring) => (
                <div
                  key={ring}
                  className="absolute rounded-[2rem] border border-white/10"
                  style={{
                    left: `${ring * 8}%`,
                    top: `${ring * 8}%`,
                    width: `${100 - ring * 16}%`,
                    height: `${100 - ring * 16}%`,
                    borderRadius: '2rem',
                    animation: `elegant-glow ${1.5 + ring * 0.2}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${ring * 0.15}s infinite`,
                    boxShadow: `inset 0 0 ${20 + ring * 5}px rgba(255, 255, 255, ${0.1 - ring * 0.02})`,
                  }}
                />
              ))}
              
              {/* Particules ultra-raffinées avec trajectoires courbes */}
              {Array.from({ length: 50 }).map((_, i) => {
                const angle = (i / 50) * Math.PI * 2;
                const distance = 70 + Math.random() * 80;
                const delay = Math.random() * 0.4;
                const duration = 1.5 + Math.random() * 0.8;
                const colors = [
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 245, 200, 0.85)',
                  'rgba(255, 230, 150, 0.75)',
                  'rgba(240, 240, 255, 0.8)',
                  'rgba(255, 220, 180, 0.7)',
                ];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                const size = 2.5 + Math.random() * 3.5;
                
                return (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color,
                      boxShadow: `0 0 ${size * 3}px ${color}, 0 0 ${size * 6}px ${color}40`,
                      '--x': `${x}px`,
                      '--y': `${y}px`,
                      animation: `elegant-particle ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards`,
                      filter: 'blur(0.5px)',
                    } as React.CSSProperties & { '--x': string; '--y': string }}
                  />
                );
              })}
              
              {/* Étincelles ultra-raffinées avec effet de brillance */}
              {Array.from({ length: 25 }).map((_, i) => {
                const angle = (i / 25) * Math.PI * 2;
                const distance = 45 + Math.random() * 65;
                const delay = Math.random() * 0.3;
                const duration = 1.2 + Math.random() * 0.6;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                return (
                  <div
                    key={`sparkle-${i}`}
                    className="absolute text-white"
                    style={{
                      left: '50%',
                      top: '50%',
                      fontSize: '18px',
                      filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 20px rgba(255, 240, 200, 0.6))',
                      '--x': `${x}px`,
                      '--y': `${y}px`,
                      animation: `elegant-sparkle ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards`,
                    } as React.CSSProperties & { '--x': string; '--y': string }}
                  >
                    ✨
                  </div>
                );
              })}
              
              {/* Halo final ultra-élégant avec gradient complexe */}
              <div 
                className="absolute inset-0 rounded-[2rem]"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.5) 0%, rgba(255, 240, 200, 0.3) 30%, rgba(200, 220, 255, 0.2) 50%, transparent 80%)',
                  animation: 'elegant-bloom 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s forwards',
                  filter: 'blur(15px)',
                }}
              />
            </div>
          </>
        )}

        {/* Canvas de grattage */}
        {isUnlocked && !localOpened && (
          <>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-20 touch-none rounded-[2rem]"
              style={{ 
                cursor: isScratching ? 'grabbing' : 'grab',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            />
            {/* Removed discrete scratch-hand indicator as requested */}
          </>
        )}

        {/* Couche de fond pour les jours non disponibles - effet givre bleu/blanc */}
        {!isUnlocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2rem] overflow-hidden pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(200,230,255,0.6), rgba(255,255,255,0.95))',
              border: '1px solid rgba(180,210,255,0.6)'
            }}
          >
            {/* Blobs givrés floutés */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 30%), radial-gradient(circle at 80% 70%, rgba(240,250,255,0.6) 0%, rgba(255,255,255,0) 25%)',
              filter: 'blur(8px)'
            }} />

            {/* Subtile pattern de cristaux (SVG) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.28 }}>
              <defs>
                <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#bfe1ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <g fill="url(#g1)">
                <circle cx="30" cy="40" r="6" />
                <circle cx="70" cy="30" r="4" />
                <circle cx="140" cy="50" r="5" />
                <circle cx="110" cy="80" r="3" />
                <circle cx="40" cy="120" r="5" />
                <circle cx="160" cy="140" r="6" />
              </g>
            </svg>

            {/* Centre: petite icône / label verrouillé */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 10V8a6 6 0 1112 0v2" stroke="#0369A1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="#0369A1" strokeWidth="1.4" />
                <circle cx="12" cy="15" r="1.2" fill="#0369A1" />
              </svg>
              <span className="text-xs font-semibold text-sky-700/90">Too soon</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScratchReveal;
