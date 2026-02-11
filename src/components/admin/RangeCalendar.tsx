"use client";

import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

interface RangeCalendarProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

export default function RangeCalendar({ startDate, endDate, onChange }: RangeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => startDate || new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const result: Date[] = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      result.push(new Date(year, month, -i));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      result.push(new Date(year, month, i));
    }

    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push(new Date(year, month + 1, i));
    }

    return result;
  }, [year, month]);

  const handleDateClick = (date: Date) => {
    if ((!startDate && !endDate) || (startDate && endDate)) {
      onChange(date, null);
    } else if (startDate && !endDate && date < startDate) {
      onChange(date, null);
    } else if (startDate && !endDate && date >= startDate) {
      onChange(startDate, date);
    }
  };

  const isInRange = (date: Date) => {
    if (startDate && endDate) {
      return date >= startDate && date <= endDate;
    }
    if (startDate && !endDate && hoverDate) {
      if (hoverDate < startDate) return false;
      return date >= startDate && date <= hoverDate;
    }
    return false;
  };

  const isSelected = (date: Date) => {
    return (
      (startDate && date.getTime() === startDate.getTime()) ||
      (endDate && date.getTime() === endDate.getTime())
    );
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === month;
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <FontAwesomeIcon icon={faChevronLeft} size="sm" />
        </button>
        
        <span className="font-bold text-gray-800 text-lg">
          {year}年 {month + 1}月
        </span>

        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <FontAwesomeIcon icon={faChevronRight} size="sm" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2 text-center">
        {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
          <div
            key={i}
            className={`text-xs font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-sm">
        {days.map((date, idx) => {
          const selected = isSelected(date);
          const inRange = isInRange(date);
          const current = isCurrentMonth(date);
          const today = isToday(date);
          
          const isRangeStart = startDate && date.getTime() === startDate.getTime();
          const isRangeEnd = endDate && date.getTime() === endDate.getTime();
          const isHoverEnd = !endDate && startDate && hoverDate && date.getTime() === hoverDate.getTime();

          // クラス名の動的生成 (cnの代わり)
          const bgClass = inRange ? "bg-blue-100" : "bg-transparent";
          
          let roundClass = "";
          if (isRangeStart && endDate) roundClass = "rounded-l-full left-1";
          else if (isRangeEnd) roundClass = "rounded-r-full right-1";
          else if (isRangeStart && !endDate && hoverDate && hoverDate > startDate) roundClass = "rounded-l-full bg-blue-100 left-1";
          else if (isHoverEnd && hoverDate && startDate && hoverDate > startDate) roundClass = "rounded-r-full bg-blue-100 right-1";

          const buttonBaseClass = "relative z-10 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-all text-sm font-medium";
          const buttonStateClass = selected
            ? "bg-blue-600 text-white shadow-sm scale-110"
            : current
            ? "text-gray-700 hover:bg-gray-100"
            : "text-gray-300";
          const todayClass = (!selected && today) ? "ring-2 ring-blue-400 ring-offset-1 font-bold" : "";

          return (
            <div
              key={idx}
              className="relative p-0.5"
              onMouseEnter={() => setHoverDate(date)}
              onMouseLeave={() => setHoverDate(null)}
            >
              {/* 背景ハイライト */}
              <div
                className={`absolute inset-y-0.5 left-0 right-0 z-0 transition-colors ${bgClass} ${roundClass}`}
              />
              
              {/* 日付ボタン */}
              <button
                onClick={() => handleDateClick(date)}
                className={`${buttonBaseClass} ${buttonStateClass} ${todayClass}`}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}