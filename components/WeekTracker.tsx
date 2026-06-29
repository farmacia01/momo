"use client";

import { format, startOfWeek, addDays, getDay, isSameDay, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check } from "lucide-react";
import { useTheme } from "@/app/providers";
import { parseDateStr } from "@/lib/utils/dose";

interface WeekTrackerProps {
  doseDates: string[];
  nextDoseDate?: Date;
}

export function WeekTracker({ doseDates, nextDoseDate }: WeekTrackerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date();
  // Align the 7-day window to the user's treatment day-of-week (day they inject).
  // e.g. if last dose was a Saturday, always show Sat→Fri instead of Mon→Sun.
  const lastDoseDate = doseDates.length > 0 ? parseDateStr(doseDates[0]) : null;
  const treatmentDow = lastDoseDate ? (getDay(lastDoseDate) as 0|1|2|3|4|5|6) : 1;
  const start = startOfWeek(today, { weekStartsOn: treatmentDow });

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const hasDose = doseDates.some(d => isSameDay(parseDateStr(d), date));
    const isNextDoseDay = nextDoseDate ? isSameDay(nextDoseDate, date) : false;
    const isDayToday = isSameDay(date, today);
    const isDayPast = isPast(date) && !isDayToday;

    return { date, label: format(date, "EE", { locale: ptBR }).substring(0, 2), hasDose, isToday: isDayToday, isPast: isDayPast, isNextDoseDay };
  });

  return (
    <div className="flex justify-between items-end w-full px-1">
      {days.map((day, idx) => {
        let bgStyle: React.CSSProperties = {};
        let circleContent = null;

        if (day.hasDose) {
          bgStyle = { background: "#ff6500", boxShadow: "0 4px 12px rgba(255,101,0,0.4)" };
          circleContent = <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />;
        } else if (day.isNextDoseDay) {
          bgStyle = { background: "rgba(255,101,0,0.15)", border: "1.5px solid rgba(255,101,0,0.5)" };
          circleContent = <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#ff6500" }} />;
        } else if (day.isToday) {
          bgStyle = isDark
            ? { background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)" }
            : { background: "rgba(15,23,42,0.06)", border: "1.5px solid rgba(15,23,42,0.15)" };
        } else if (day.isPast) {
          bgStyle = isDark
            ? { background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.06)" }
            : { background: "rgba(15,23,42,0.03)", border: "1.5px solid rgba(15,23,42,0.07)" };
        } else {
          bgStyle = isDark
            ? { background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.08)" }
            : { background: "rgba(15,23,42,0.04)", border: "1.5px solid rgba(15,23,42,0.09)" };
        }

        const labelColor = day.hasDose
          ? "#ff6500"
          : (day.isToday || day.isNextDoseDay)
            ? (isDark ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.9)")
            : (isDark ? "rgba(255,255,255,0.3)" : "rgba(15,23,42,0.35)");

        return (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div
              className="h-[34px] w-[34px] rounded-full flex items-center justify-center transition-all"
              style={bgStyle}
            >
              {circleContent}
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: labelColor }}
            >
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
