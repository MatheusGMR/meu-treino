import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

interface WorkoutCardProps {
  workoutName: string;
  imageUrl?: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  onClick: () => void;
}

export const WorkoutCard = ({ workoutName, imageUrl, status, onClick }: WorkoutCardProps) => {
  const statusConfig = {
    completed: { label: 'Concluído', icon: CheckCircle2, variant: 'success' as const },
    'in-progress': { label: 'Em andamento', icon: Clock, variant: 'default' as const },
    upcoming: { label: 'Próximo', icon: Clock, variant: 'secondary' as const },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-[20px] overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] mx-5"
      style={{ height: '240px', maxWidth: 'calc(100% - 40px)' }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/30">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={workoutName}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Overlay gradient - stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {/* Status badge */}
        <Badge 
          variant={config.variant}
          className="self-start mb-3 flex items-center gap-1.5 px-3 py-1"
        >
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </Badge>

        {/* Workout name */}
        <h3 className="text-2xl font-bold text-white text-left drop-shadow-lg">
          {workoutName}
        </h3>
      </div>
    </button>
  );
};
