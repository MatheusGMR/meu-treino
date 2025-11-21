interface GoalsDisplayProps {
  mainGoal: string;
  targetWeight: string;
}

export const GoalsDisplay = ({ mainGoal, targetWeight }: GoalsDisplayProps) => {
  return (
    <div className="px-5 mb-6">
      <div className="flex items-center justify-between">
        {/* Objetivo Principal */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            Objetivo principal
          </p>
          <p className="text-xl font-bold text-foreground">
            {mainGoal}
          </p>
        </div>

        {/* Linha Divisória Vertical */}
        <div className="h-12 w-px bg-border mx-6" />

        {/* Meta de Peso */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            Meta de peso
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">
              {targetWeight}
            </span>
            <span className="text-sm text-muted-foreground">
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
