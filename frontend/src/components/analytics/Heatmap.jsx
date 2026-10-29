import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export const Heatmap = ({ data = [], onSelectDate }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const getIntensityClass = (day) => {
    if (day.scheduled === 0 && day.completed === 0) {
      return 'bg-slate-100 border-slate-200/60 text-slate-400';
    }
    if (day.completed === 0 && day.scheduled > 0) {
      return 'bg-amber-50 border-amber-200/80 text-amber-600'; // scheduled but missed
    }
    switch (day.intensity) {
      case 4:
        return 'bg-emerald-600 border-emerald-700 text-white';
      case 3:
        return 'bg-emerald-500 border-emerald-600 text-white';
      case 2:
        return 'bg-emerald-400 border-emerald-500 text-white';
      case 1:
        return 'bg-emerald-200 border-emerald-300 text-emerald-900';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-400';
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    if (onSelectDate) {
      onSelectDate(day);
    }
  };

  // Group 90 days into columns of weeks (7 days per column)
  const columns = [];
  let currentColumn = [];

  data.forEach((day, index) => {
    currentColumn.push(day);
    if (currentColumn.length === 7 || index === data.length - 1) {
      columns.push(currentColumn);
      currentColumn = [];
    }
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>90-Day Consistency Heatmap</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily activity intensity across all scheduled routines
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-200" title="No habits" />
            <span className="w-3 h-3 rounded-xs bg-amber-50 border border-amber-200" title="Missed" />
            <span className="w-3 h-3 rounded-xs bg-emerald-200" title="Low (1-25%)" />
            <span className="w-3 h-3 rounded-xs bg-emerald-400" title="Moderate (26-50%)" />
            <span className="w-3 h-3 rounded-xs bg-emerald-500" title="High (51-75%)" />
            <span className="w-3 h-3 rounded-xs bg-emerald-600" title="Complete (76-100%)" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5 min-w-max">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1.5">
              {col.map((day) => {
                const isHovered = hoveredDay?.date === day.date;
                const isSelected = selectedDay?.date === day.date;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    aria-label={`Date ${day.date}: ${day.completed}/${day.scheduled} habits completed`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs border transition-all ${getIntensityClass(
                      day
                    )} ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 ring-offset-1 scale-125 z-10'
                        : isHovered
                        ? 'scale-110 shadow-xs'
                        : ''
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hover / Selected Day Details Card */}
      {(hoveredDay || selectedDay) && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {format(parseISO((hoveredDay || selectedDay).date), 'EEEE, MMMM d, yyyy')}:
            </span>
            <span className="text-slate-600 font-medium">
              {(hoveredDay || selectedDay).completed} of {(hoveredDay || selectedDay).scheduled} scheduled completed (
              {(hoveredDay || selectedDay).rate}%)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(hoveredDay || selectedDay).completedHabits?.length > 0 ? (
              (hoveredDay || selectedDay).completedHabits.map((name, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium text-[10px]"
                >
                  ✓ {name}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic text-[11px]">No habits recorded for this day</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
