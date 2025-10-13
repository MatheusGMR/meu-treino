interface SessionProgressBarProps {
  current: number;
  total: number;
}

export const SessionProgressBar = ({ current, total }: SessionProgressBarProps) => {
  const progress = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Progresso</span>
        <span className="text-muted-foreground">
          {current} de {total} exercícios
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
