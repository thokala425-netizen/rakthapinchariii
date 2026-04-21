import { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 20;

// Dummy AI Generated Music Tracks
const TRACKS = [
  {
    id: 1,
    title: 'Neon Drive',
    artist: 'AI.01',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 2,
    title: 'Cybernetic Pulse',
    artist: 'AI.02',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 3,
    title: 'Digital Horizon',
    artist: 'AI.03',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

type Point = { x: number; y: number };

const randomFood = (): Point => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE)
});

export default function App() {
  // ---- MUSIC PLAYER STATE ----
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // ---- SNAKE GAME STATE ----
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [dir, setDir] = useState<Point>({ x: 0, y: -1 }); // initial direction UP
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [topRecord, setTopRecord] = useState(0);
  const [paused, setPaused] = useState(false);
  const dirRef = useRef<Point>({ x: 0, y: -1 }); // To prevent rapid double turn deaths

  useEffect(() => {
    if (score > topRecord) {
      setTopRecord(score);
    }
  }, [score, topRecord]);

  // --- Music Controls ---
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipForward = () => {
    const nextIdx = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
  };

  const skipBackward = () => {
    const nextIdx = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(e => {
        console.error("Audio playback failed", e);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex]);

  // --- Snake Controls ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;

    const currentDir = dirRef.current;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (currentDir.y !== 1) setDir({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (currentDir.y !== -1) setDir({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (currentDir.x !== 1) setDir({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (currentDir.x !== -1) setDir({ x: 1, y: 0 });
        break;
      case ' ':
        setPaused(p => !p);
        break;
    }
  }, [gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(randomFood());
    setDir({ x: 0, y: -1 });
    dirRef.current = { x: 0, y: -1 };
    setGameOver(false);
    setScore(0);
    setPaused(false);
  };

  // --- Game Loop ---
  useEffect(() => {
    if (gameOver || paused) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        // Wall collisions
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(randomFood());
          // Don't pop to grow
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 120);
    return () => clearInterval(interval);
  }, [dir, food, gameOver, paused]);

  return (
    <div className="h-screen w-full bg-black text-cyan font-mono flex flex-col p-4 md:p-8 relative noise-bg screen-tear z-10 selection:bg-magenta selection:text-black">
       <div className="scanlines"></div>
       <div className="fixed inset-0 pointer-events-none opacity-20 z-50 mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #0ff 2px, #0ff 4px)' }}></div>
       
       <header className="mb-4 lg:mb-8 border-b-4 border-magenta pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <h1 className="font-display text-2xl md:text-5xl text-white glitch" data-text="SYNTH_SNAKE">SYNTH_SNAKE</h1>
          <div className="text-magenta font-display text-sm md:text-xl glitch" data-text={`SCORE:${score.toString().padStart(4, '0')}`}>SCORE:{score.toString().padStart(4, '0')}</div>
       </header>

       <main className="flex-1 flex flex-col lg:flex-row gap-6 relative z-10 min-h-0">
          <aside className="w-full lg:w-1/3 flex flex-col gap-6 order-2 lg:order-1 overflow-y-auto">
             <div className="border-4 border-cyan p-4 bg-black/80 shadow-[4px_4px_0px_#ff00ff]">
                <h2 className="font-display text-magenta mb-4 text-xs md:text-sm">-- AUDIO_SYS_CTL --</h2>
                <div className="flex flex-col gap-2 mb-6">
                  {TRACKS.map((track, i) => (
                    <button 
                      key={track.id} 
                      onClick={() => {setCurrentTrackIndex(i); setIsPlaying(true);}}
                      className={`text-left p-2 font-display text-[10px] md:text-xs transition-none border-2 border-transparent hover:border-cyan hover:bg-cyan/10 ${i === currentTrackIndex ? 'bg-magenta text-black border-magenta hover:bg-magenta hover:border-magenta' : 'text-cyan'}`}
                    >
                      {i === currentTrackIndex ? '> ' : '  '}{track.title} [v{track.id}.0]
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-4 font-display text-sm md:text-base items-center">
                   <button onClick={skipBackward} className="text-cyan hover:text-white bg-black border-2 border-cyan px-2 hover:bg-cyan hover:-translate-y-0.5 active:translate-y-0 transition-none">[&lt;&lt;]</button>
                   <button onClick={handlePlayPause} className="text-magenta hover:text-black bg-magenta/20 p-2 border-2 border-magenta hover:bg-magenta hover:-translate-y-0.5 active:translate-y-0 transition-none">
                     {isPlaying ? '[||]' : '[ >]'}
                   </button>
                   <button onClick={skipForward} className="text-cyan hover:text-white bg-black border-2 border-cyan px-2 hover:bg-cyan hover:-translate-y-0.5 active:translate-y-0 transition-none">[&gt;&gt;]</button>
                </div>
                <div className="mt-4 flex gap-2 items-center text-xs font-display">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-cyan hover:text-magenta hover:underline underline-offset-4">
                     {isMuted ? 'MOD_MUTE: ON' : 'MOD_MUTE: OFF'}
                  </button>
                </div>
             </div>

             <div className="border-4 border-magenta p-4 text-cyan text-sm sm:text-lg uppercase space-y-3 bg-black/80 shadow-[4px_4px_0px_#00ffff]">
                <p>&gt; STATUS: {gameOver ? 'FATAL_ERROR' : paused ? 'SUSPENDED' : 'EXECUTING'}</p>
                <p>&gt; RECORD_SYS: {topRecord}</p>
                <div className="h-0.5 bg-magenta w-full my-2"></div>
                <p className="text-magenta">&gt; IO_CTRL: [W_A_S_D] OR [ARROWS]</p>
                <p className="text-magenta">&gt; HLT_CMD: [SPACE]</p>
             </div>
          </aside>

          <section className="flex-1 flex justify-center items-center order-1 lg:order-2 p-2">
             <div className="w-full max-w-[500px] aspect-square border-8 border-magenta bg-cyan/10 relative shadow-[8px_8px_0px_rgba(0,255,255,0.5)]"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                  }}>
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  
                  const isSnake = snake.some(seg => seg.x === x && seg.y === y);
                  const isHead = snake[0].x === x && snake[0].y === y;
                  const isFood = food.x === x && food.y === y;

                  if (isHead) return <div key={i} className="bg-white border-2 border-magenta" style={{ gridColumn: x + 1, gridRow: y + 1 }} />;
                  if (isSnake) return <div key={i} className="bg-cyan border border-black" style={{ gridColumn: x + 1, gridRow: y + 1 }} />;
                  if (isFood) return <div key={i} className="bg-magenta animate-pulse" style={{ gridColumn: x + 1, gridRow: y + 1 }} />;
                  return <div key={i} className="border border-cyan/10" style={{ gridColumn: x + 1, gridRow: y + 1 }} />;
                })}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 border-4 border-magenta">
                    <h2 className="font-display text-2xl sm:text-4xl text-magenta glitch mb-4 text-center" data-text="SYSTEM_HALT">SYSTEM_HALT</h2>
                    <p className="text-cyan font-mono text-xl md:text-2xl mb-8">&gt; CORE_DUMPED: {score}</p>
                    <button onClick={resetGame} className="font-display text-black bg-cyan border-4 border-cyan p-4 hover:bg-black hover:text-cyan hover:border-magenta transition-none uppercase">REBOOT_SEQ</button>
                  </div>
                )}
                
                {!gameOver && paused && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center border-4 border-cyan screen-tear">
                    <h2 className="font-display text-2xl sm:text-4xl text-white glitch" data-text="INTERRUPT">INTERRUPT</h2>
                  </div>
                )}
             </div>
          </section>
       </main>

       <audio ref={audioRef} src={TRACKS[currentTrackIndex].url} onEnded={skipForward} muted={isMuted} />
    </div>
  );
}

