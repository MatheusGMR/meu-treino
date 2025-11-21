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
  onInfoClick 
}: ExerciseListItemProps) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-[12px] bg-card border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 rounded-[8px] overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground text-sm truncate">
          {name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          {duration && (
            <span className="text-xs text-muted-foreground">
              {duration}
            </span>
          )}
          {sets && reps && (
            <span className="text-xs text-muted-foreground">
              {sets}x {reps}
            </span>
          )}
        </div>
      </div>

      {/* Info button */}
      {onInfoClick && (
        <button
          onClick={onInfoClick}
          className="flex-shrink-0 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <Info className="w-5 h-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
