import { CheckCircle2, Lock } from "lucide-react";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
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
                  relative flex-shrink-0 rounded-[16px] overflow-hidden transition-all duration-300
                  ${isActive ? 'ring-4 ring-success shadow-lg scale-105' : 'shadow-md'}
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                `}
                style={{ width: '120px', height: '140px' }}
              >
                {/* Thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50">
                  {day.thumbnailUrl && (
                    <img 
                      src={day.thumbnailUrl} 
                      alt={`Dia ${day.dayNumber}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Locked overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Day label */}
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-white font-bold text-sm drop-shadow-lg">
                    Dia {day.dayNumber}
                  </span>
                </div>

                {/* Completed indicator */}
                {isCompleted && !isLocked && (
                  <div className="absolute top-2 right-2 bg-success rounded-full p-1">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
