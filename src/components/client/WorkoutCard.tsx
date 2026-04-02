import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ChevronRight } from "lucide-react";

interface WorkoutCardProps {
  workoutName: string;
  imageUrl?: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  onClick: () => void;
}

export const WorkoutCard = ({ workoutName, imageUrl, status, onClick }: WorkoutCardProps) => {
  const statusConfig = {
    completed: { label: 'Concluído', icon: CheckCircle2, badgeClass: 'bg-green-100 text-green-700 border-green-200' },
    'in-progress': { label: 'Em andamento', icon: Clock, badgeClass: 'bg-primary/10 text-primary border-primary/20' },
    upcoming: { label: 'Próximo', icon: Clock, badgeClass: 'bg-muted text-muted-foreground border-border' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg overflow-hidden border border-border bg-card transition-all duration-300 hover:border-primary hover:shadow-[0_8px_30px_hsl(348_83%_47%/0.15)] hover:-translate-y-0.5 active:scale-[0.98] mx-5"
      style={{ maxWidth: 'calc(100% - 40px)' }}
    >
      {/* Image */}
      <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
        <div className="absolute inset-0 bg-muted">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={workoutName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <span className="text-4xl">🏋️</span>
            </div>
          )}
        </div>
        
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.badgeClass}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground text-left">
          {workoutName}
        </h3>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};
