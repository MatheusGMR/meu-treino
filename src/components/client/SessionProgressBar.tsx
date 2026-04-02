interface SessionProgressBarProps {
  current: number;
  total: number;
}

export const SessionProgressBar = ({ current, total }: SessionProgressBarProps) => {
  const progress = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-foreground">Progresso</span>
        <span className="text-muted-foreground">
          {current} de {total} exercícios
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 12px hsl(var(--primary) / 0.4)',
          }}
        />
      </div>
    </div>
  );
};
