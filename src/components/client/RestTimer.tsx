import { useState, useEffect } from "react";
import { Pause, Play, SkipForward } from "lucide-react";

interface RestTimerProps {
  restTime: number;
  onComplete: () => void;
}

export const RestTimer = ({ restTime, onComplete }: RestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(restTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setIsRunning(false); onComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const handleStart = () => { setTimeLeft(restTime); setIsRunning(true); };
  const handlePause = () => setIsRunning(false);
  const handleSkip = () => { setIsRunning(false); setTimeLeft(0); onComplete(); };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((restTime - timeLeft) / restTime) * 100;

  return (
    <div className="space-y-3">
      <div className="relative w-28 h-28 mx-auto">
        <svg className="transform -rotate-90 w-28 h-28">
          <circle cx="56" cy="56" r="52" stroke="hsl(var(--border))" strokeWidth="5" fill="none" />
          <circle
            cx="56" cy="56" r="52"
            stroke="hsl(var(--primary))"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
            style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.4))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{formatTime(timeLeft)}</span>
          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Descanso</span>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {!isRunning && timeLeft === restTime && (
          <button onClick={handleStart} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2">
            <Play className="w-4 h-4" /> Iniciar
          </button>
        )}
        {isRunning && (
          <button onClick={handlePause} className="px-5 py-2 rounded-lg border border-border text-foreground font-bold text-sm flex items-center gap-2">
            <Pause className="w-4 h-4" /> Pausar
          </button>
        )}
        {timeLeft > 0 && timeLeft < restTime && (
          <button onClick={handleSkip} className="px-5 py-2 rounded-lg border border-border text-foreground font-bold text-sm flex items-center gap-2">
            <SkipForward className="w-4 h-4" /> Pular
          </button>
        )}
      </div>
    </div>
  );
};
