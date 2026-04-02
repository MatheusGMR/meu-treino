import { CheckCircle2, Lock, Dumbbell } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DayCarouselProps {
  days: Array<{
    id: string;
    dayNumber: number;
    completed: boolean;
    locked: boolean;
    thumbnailUrl?: string;
  }>;
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
}

export const DayCarousel = ({ days, selectedDay, onSelectDay }: DayCarouselProps) => {
  return (
    <div className="px-5 mb-6">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-4">
          {days.map((day) => {
            const isActive = selectedDay === day.dayNumber;
            const isCompleted = day.completed;
            const isLocked = day.locked;
            
            return (
              <button
                key={day.id}
                onClick={() => !isLocked && onSelectDay(day.dayNumber)}
                disabled={isLocked}
                className={`
                  relative flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center
                  border-2 transition-all duration-200
                  ${isCompleted 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : isActive 
                      ? 'bg-card border-primary border-[3px] text-foreground' 
                      : 'bg-card border-border text-foreground hover:border-primary/50'
                  }
                  ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}
                `}
              >
                {isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Dumbbell className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={`text-xs font-bold mt-1 ${isCompleted ? 'text-primary-foreground' : ''}`}>
                  Dia {day.dayNumber}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
