import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward } from "lucide-react";

interface RestTimerProps {
  restTime: number; // em segundos
  onComplete: () => void;
}

export const RestTimer = ({ restTime, onComplete }: RestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(restTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const handleStart = () => {
    setTimeLeft(restTime);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setTimeLeft(0);
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((restTime - timeLeft) / restTime) * 100;

  return (
    <div className="space-y-4">
      <div className="relative w-32 h-32 mx-auto">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 60}`}
            strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
            className="text-primary transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {!isRunning && timeLeft === restTime && (
          <Button onClick={handleStart} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Iniciar Descanso
          </Button>
        )}
        {isRunning && (
          <Button onClick={handlePause} variant="outline" size="lg">
            <Pause className="w-5 h-5 mr-2" />
            Pausar
          </Button>
        )}
        {timeLeft > 0 && timeLeft < restTime && (
          <Button onClick={handleSkip} variant="outline" size="lg">
            <SkipForward className="w-5 h-5 mr-2" />
            Pular
          </Button>
        )}
      </div>
    </div>
  );
};
