"use client";

import { format, startOfWeek, addDays, isSameDay, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check } from "lucide-react";

interface WeekTrackerProps {
  doseDates: string[]; // ISO strings
  nextDoseDate?: Date;
}

export function WeekTracker({ doseDates }: WeekTrackerProps) {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const hasDose = doseDates.some(d => isSameDay(new Date(d), date));
    const isDayToday = isSameDay(date, today);
    const isDayPast = isPast(date) && !isDayToday;
    
    return {
      date,
      label: format(date, "EE", { locale: ptBR }).substring(0, 2),
      hasDose,
      isToday: isDayToday,
      isPast: isDayPast,
    };
  });

  return (
    <div className="flex justify-between items-end w-full px-1">
      {days.map((day, idx) => {
        let circleContent = null;
        let circleStyle = "";
        
        if (day.hasDose) {
          circleStyle = "bg-white shadow-dose text-forest-light";
          circleContent = <Check className="h-3.5 w-3.5" strokeWidth={3} />;
        } else if (day.isToday) {
          circleStyle = "bg-white/20 border-[1.5px] border-white/50";
          circleContent = <div className="h-1.5 w-1.5 rounded-full bg-white" />;
        } else if (day.isPast) {
          circleStyle = "bg-white/5 border-[1.5px] border-white/10";
        } else {
          circleStyle = "bg-white/7 border-[1.5px] border-white/15";
        }

        return (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className={`h-[34px] w-[34px] rounded-full flex items-center justify-center transition-all ${circleStyle}`}>
              {circleContent}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${day.isToday || day.hasDose ? 'text-white' : 'text-white/45'}`}>
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
