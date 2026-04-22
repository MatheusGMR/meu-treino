import { useEffect, useRef, useState } from "react";

interface RestTimerProps {
  restTime: number;
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (secondsLeft: number) => void;
}

export const RestTimer = ({
  restTime,
  autoStart = true,
  onComplete,
  onTick,
}: RestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(restTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const completedRef = useRef(false);

  useEffect(() => {
    setTimeLeft(restTime);
    setIsRunning(autoStart);
    completedRef.current = false;
  }, [restTime, autoStart]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          setIsRunning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete, onTick]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((restTime - timeLeft) / restTime) * 100;
  const isDone = timeLeft === 0;

  return (
    <div className="space-y-2 flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle cx="64" cy="64" r="58" stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke={isDone ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 58}`}
            strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
            style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{formatTime(timeLeft)}</span>
          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {isDone ? "Pronto" : "Descanso"}
          </span>
        </div>
      </div>
    </div>
  );
};
