import React, { useState, useRef, useEffect, useMemo } from 'react';

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface CalendarDatePickerProps {
  value: string; // Format: 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  label?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  value,
  onChange,
  label,
  required,
  minDate,
  maxDate,
  placeholder = 'Select date...',
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or default to null
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedDate ? selectedDate.getMonth() : new Date().getMonth();
  });

  // Sync view when value changes from outside
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate 10-year range for fast year selection
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 10; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Generate days grid
  const daysGrid = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const month = viewMonth === 0 ? 11 : viewMonth - 1;
      const year = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        month,
        year,
        isCurrentMonth: false,
        dateStr,
        isSelected: value === dateStr,
        isToday: false,
        isDisabled: Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)),
      });
    }

    // Days in current month
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        dateStr,
        isSelected: value === dateStr,
        isToday: dateStr === todayStr,
        isDisabled: Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)),
      });
    }

    // Trailing days from next month to complete the grid (35 or 42 slots)
    const totalSlots = cells.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - cells.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const month = viewMonth === 11 ? 0 : viewMonth + 1;
      const year = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        month,
        year,
        isCurrentMonth: false,
        dateStr,
        isSelected: value === dateStr,
        isToday: false,
        isDisabled: Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)),
      });
    }

    return cells;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  const handleSelectDate = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onChange(dateStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleAddDays = (e: React.MouseEvent, daysToAdd: number) => {
    e.stopPropagation();
    const base = selectedDate ? new Date(selectedDate) : new Date();
    base.setDate(base.getDate() + daysToAdd);
    const dateStr = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
    onChange(dateStr);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setIsOpen(false);
  };

  const formattedDisplay = useMemo(() => {
    if (!selectedDate) return '';
    const day = selectedDate.getDate();
    const month = MONTH_NAMES[selectedDate.getMonth()].slice(0, 3);
    const year = selectedDate.getFullYear();
    return `${day} ${month} ${year}`;
  }, [selectedDate]);

  return (
    <div ref={containerRef} style={{ fontFamily: FONT }} className={`relative text-xs ${className}`}>
      {label && (
        <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1 tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button Field */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2 rounded-xl bg-white border text-left text-xs transition-all flex items-center justify-between shadow-xs cursor-pointer select-none group ${
          isOpen
            ? 'border-[#22C55E] ring-2 ring-emerald-500/15'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={value ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal'}>
          {formattedDisplay || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-emerald-600 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </button>

      {/* Calendar Popover Dropdown with calendar.png background */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-2xl p-4 overflow-hidden animate-scale-up`}
        >
          {/* ── Cultural Illustration Background Layer (calendar.png) with increased transparency ── */}
          <div
            className="absolute inset-0 pointer-events-none select-none z-0 rounded-2xl"
            style={{
              backgroundImage: 'url(/calendar.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.20, // Increased transparency: delicate, soft background so calendar numbers and days pop with maximum clarity
            }}
          />

          {/* ── Interactive Calendar Content Layer ── */}
          <div className="relative z-10 space-y-3">
            {/* Header: Month / Year Navigation & Quick Jump */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100/80">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 text-gray-700 hover:text-gray-950 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-gray-800 cursor-pointer focus:outline-none hover:text-emerald-700 transition-colors rounded px-1 py-0.5"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx} className="text-gray-900 bg-white">
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-gray-800 cursor-pointer focus:outline-none hover:text-emerald-700 transition-colors rounded px-1 py-0.5"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} className="text-gray-900 bg-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 text-gray-700 hover:text-gray-950 transition-colors cursor-pointer"
                title="Next Month"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAYS_OF_WEEK.map((dw) => (
                <span key={dw} className="text-[11px] font-bold text-gray-500 uppercase py-1">
                  {dw}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysGrid.map((cell, idx) => {
                let cellStyle = 'text-gray-800 hover:bg-emerald-50 hover:text-emerald-800 font-semibold';
                if (!cell.isCurrentMonth) {
                  cellStyle = 'text-gray-400/80 hover:bg-gray-100/60 font-normal';
                }
                if (cell.isSelected) {
                  cellStyle = 'bg-[#22C55E] text-white font-bold shadow-md shadow-emerald-500/25 hover:bg-emerald-600';
                } else if (cell.isToday) {
                  cellStyle = 'text-emerald-700 font-bold bg-emerald-100/80 border border-emerald-300';
                }
                if (cell.isDisabled) {
                  cellStyle = 'text-gray-300 line-through opacity-40 cursor-not-allowed';
                }

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={() => handleSelectDate(cell.dateStr, cell.isDisabled)}
                    className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer select-none ${cellStyle}`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-gray-100/80 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleSetToday}
                className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={(e) => handleAddDays(e, 30)}
                className="text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
              >
                +30 Days
              </button>
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
