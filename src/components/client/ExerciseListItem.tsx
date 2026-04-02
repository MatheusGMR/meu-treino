import { Info } from "lucide-react";

interface ExerciseListItemProps {
  name: string;
  duration?: string;
  sets?: number;
  reps?: string;
  thumbnailUrl?: string;
  onInfoClick?: () => void;
}

export const ExerciseListItem = ({
  name,
  duration,
  sets,
  reps,
  thumbnailUrl,
  onInfoClick,
}: ExerciseListItemProps) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border transition-all duration-200 hover:border-primary hover:shadow-[0_4px_16px_hsl(348_83%_47%/0.15)]">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-lg">💪</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-foreground text-sm truncate">{name}</h4>
        <div className="flex items-center gap-2 mt-1">
          {duration && <span className="text-xs text-muted-foreground">{duration}</span>}
          {sets && reps && (
            <span className="text-xs text-primary font-semibold">{sets}x {reps}</span>
          )}
        </div>
      </div>

      {/* Info button */}
      {onInfoClick && (
        <button onClick={onInfoClick} className="flex-shrink-0 p-2 rounded-full hover:bg-muted transition-colors">
          <Info className="w-5 h-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
