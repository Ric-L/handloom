import React, { useState, useEffect, useRef, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DateOfBirthPickerProps {
  id?: string;
  value: string; // Expected ISO format: YYYY-MM-DD or ""
  onChange: (value: string) => void;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
  maxDate?: string; // ISO YYYY-MM-DD, defaults to today
  defaultYear?: number;
  showAge?: boolean;
  inputClassName?: string;
  placeholder?: string;
}

type PopoverView = "days" | "months" | "years";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
  const clean = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const [yStr, mStr, dStr] = clean.split("-");
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  const d = Number(dStr);
  if (m < 0 || m > 11) return null;
  const maxD = getDaysInMonth(y, m);
  if (d < 1 || d > maxD) return null;
  return { year: y, month: m, day: d };
}

function toISO(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatISOToDisplay(iso: string): string {
  const parsed = parseISO(iso);
  if (!parsed) return "";
  return `${String(parsed.day).padStart(2, "0")}/${String(parsed.month + 1).padStart(2, "0")}/${parsed.year}`;
}

function formatDigitsToDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function computeAge(iso: string): number | null {
  const parsed = parseISO(iso);
  if (!parsed) return null;
  const now = new Date();
  let age = now.getFullYear() - parsed.year;
  const mDiff = now.getMonth() - parsed.month;
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < parsed.day)) {
    age--;
  }
  return age >= 0 && age <= 120 ? age : null;
}

interface EraRange {
  id: string;
  label: string;
  from: number;
  to: number;
}

export default function DateOfBirthPicker({
  id,
  value,
  onChange,
  required = false,
  minYear = 1940,
  maxYear,
  maxDate,
  defaultYear = 2000,
  showAge = true,
  inputClassName,
  placeholder = "DD/MM/YYYY",
}: DateOfBirthPickerProps) {
  const todayISO = useMemo(() => getTodayISO(), []);
  const effectiveMaxDate = maxDate || todayISO;
  const effectiveMaxYear = maxYear ?? new Date().getFullYear();

  const initialParsed = parseISO(value);
  const clampedDefaultYear = Math.min(Math.max(defaultYear, minYear), effectiveMaxYear);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PopoverView>("days");
  const [eraFilter, setEraFilter] = useState<string>("all");
  const [displayText, setDisplayText] = useState(() => formatISOToDisplay(value));
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(() => initialParsed?.year ?? clampedDefaultYear);
  const [viewMonth, setViewMonth] = useState(() => initialParsed?.month ?? 0);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);

  // Sync display text & calendar position whenever external value changes
  useEffect(() => {
    const formatted = formatISOToDisplay(value);
    setDisplayText(formatted);
    if (value) {
      const parsed = parseISO(value);
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
        setInlineError(null);
      }
    }
  }, [value]);

  // Close popover on click outside or Escape
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Auto-scroll highlighted year into view when Year grid opens
  useEffect(() => {
    if (open && view === "years" && activeYearRef.current) {
      activeYearRef.current.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, [open, view, eraFilter]);

  const eraRanges: EraRange[] = useMemo(() => {
    return [
      { id: "all", label: "All", from: minYear, to: effectiveMaxYear },
      { id: "2010s", label: "2010+", from: Math.max(minYear, 2010), to: effectiveMaxYear },
      { id: "2000s", label: "2000s", from: Math.max(minYear, 2000), to: Math.min(effectiveMaxYear, 2009) },
      { id: "1990s", label: "1990s", from: Math.max(minYear, 1990), to: Math.min(effectiveMaxYear, 1999) },
      { id: "1980s", label: "1980s", from: Math.max(minYear, 1980), to: Math.min(effectiveMaxYear, 1989) },
      { id: "earlier", label: "≤1979", from: minYear, to: Math.min(effectiveMaxYear, 1979) },
    ].filter((r) => r.from <= r.to);
  }, [minYear, effectiveMaxYear]);

  const allYearsDesc = useMemo(() => {
    const years: number[] = [];
    for (let y = effectiveMaxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [minYear, effectiveMaxYear]);

  const visibleYears = useMemo(() => {
    const era = eraRanges.find((r) => r.id === eraFilter);
    if (!era) return allYearsDesc;
    return allYearsDesc.filter((y) => y >= era.from && y <= era.to);
  }, [allYearsDesc, eraRanges, eraFilter]);

  const age = useMemo(() => (showAge && value ? computeAge(value) : null), [showAge, value]);

  const tryCommitTypedDate = (rawInput: string) => {
    const trimmed = rawInput.trim();

    // Allow pasting YYYY-MM-DD directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsed = parseISO(trimmed);
      if (parsed && parsed.year >= minYear && parsed.year <= effectiveMaxYear && trimmed <= effectiveMaxDate) {
        setDisplayText(formatISOToDisplay(trimmed));
        setInlineError(null);
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
        onChange(trimmed);
        return;
      }
      setInlineError("Enter a valid date within allowed range.");
      return;
    }

    const formatted = formatDigitsToDisplay(rawInput);
    setDisplayText(formatted);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 0) {
      setInlineError(null);
      if (value) onChange("");
      return;
    }

    if (digits.length < 8) {
      setInlineError(null);
      if (value) onChange("");
      return;
    }

    const dd = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2, 4));
    const yyyy = Number(digits.slice(4, 8));

    if (yyyy < minYear || yyyy > effectiveMaxYear || mm < 1 || mm > 12) {
      setInlineError(`Use DD/MM/YYYY between ${minYear} and ${effectiveMaxYear}.`);
      if (value) onChange("");
      return;
    }

    const maxDay = getDaysInMonth(yyyy, mm - 1);
    if (dd < 1 || dd > maxDay) {
      setInlineError(`Invalid day for ${SHORT_MONTHS[mm - 1]} ${yyyy}.`);
      if (value) onChange("");
      return;
    }

    const iso = toISO(yyyy, mm - 1, dd);
    if (iso > effectiveMaxDate) {
      setInlineError("Date of birth cannot be in the future.");
      if (value) onChange("");
      return;
    }

    setInlineError(null);
    setViewYear(yyyy);
    setViewMonth(mm - 1);
    onChange(iso);
  };

  const handleInputBlur = () => {
    const digits = displayText.replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 8) {
      setInlineError("Complete date as DD/MM/YYYY or pick from calendar.");
    }
  };

  const handleOpenToggle = () => {
    if (!open) {
      const parsed = parseISO(value);
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
        setView("days");
      } else {
        setViewYear(clampedDefaultYear);
        setViewMonth(0);
        setView("years");
        setEraFilter("all");
      }
    }
    setOpen((prev) => !prev);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > minYear) {
        setViewYear((y) => y - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < effectiveMaxYear) {
        setViewYear((y) => y + 1);
        setViewMonth(0);
      }
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const iso = toISO(viewYear, viewMonth, day);
    if (iso > effectiveMaxDate) return;
    setInlineError(null);
    setDisplayText(formatISOToDisplay(iso));
    onChange(iso);
    setOpen(false);
  };

  const handleClear = () => {
    setDisplayText("");
    setInlineError(null);
    onChange("");
    setOpen(false);
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const selectedParsed = parseISO(value);

  const defaultInputCls =
    "w-full border border-[#D9C5A3] rounded-lg px-4 py-2.5 text-sm text-[#3B3028] bg-[#FAF6EE] focus:bg-white focus:ring-2 focus:ring-[#8B5E3C]/25 focus:border-[#8B5E3C] focus:outline-none placeholder-[#8D7B6D] transition";

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          required={required}
          value={displayText}
          onChange={(e) => tryCommitTypedDate(e.target.value)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          aria-label="Date of Birth (DD/MM/YYYY)"
          className={`${inputClassName || defaultInputCls} ${age !== null ? "pr-24" : "pr-11"}`}
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {age !== null && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/30 pointer-events-none select-none">
              {age} yrs
            </span>
          )}
          <button
            type="button"
            onClick={handleOpenToggle}
            aria-label="Open calendar date picker"
            aria-expanded={open}
            title="Select year, month & date"
            className={`p-1.5 rounded-md transition cursor-pointer ${
              open
                ? "bg-[#8B5E3C] text-[#F5EFE3]"
                : "text-[#6E5D50] hover:text-[#3B3028] hover:bg-[#EDE3D2]"
            }`}
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {inlineError && (
        <p className="mt-1 text-xs font-medium text-[#8B2E1E]" role="alert">
          {inlineError}
        </p>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Choose date of birth"
          className="absolute left-0 mt-2 z-50 w-[316px] sm:w-[348px] max-w-[calc(100vw-2rem)] bg-[#FAF6EE] border border-[#D9C5A3] rounded-2xl shadow-2xl p-3.5 text-[#3B3028]"
        >
          {/* Top Bar: Direct Selects + View Mode Tabs */}
          <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-[#E9DEC8]">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={viewYear <= minYear && viewMonth === 0}
              aria-label="Previous month"
              className="p-1.5 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] text-[#3B3028] disabled:opacity-40 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center">
              <select
                aria-label="Month"
                value={viewMonth}
                onChange={(e) => {
                  setViewMonth(Number(e.target.value));
                  setView("days");
                }}
                className="bg-white border border-[#D9C5A3] rounded-lg px-2 py-1 text-xs font-semibold text-[#3B3028] focus:outline-none focus:border-[#8B5E3C] cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {SHORT_MONTHS[idx]}
                  </option>
                ))}
              </select>

              <select
                aria-label="Year"
                value={viewYear}
                onChange={(e) => {
                  setViewYear(Number(e.target.value));
                  setView("days");
                }}
                className="bg-white border border-[#D9C5A3] rounded-lg px-2 py-1 text-xs font-semibold text-[#3B3028] focus:outline-none focus:border-[#8B5E3C] cursor-pointer"
              >
                {allYearsDesc.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={viewYear >= effectiveMaxYear && viewMonth === 11}
              aria-label="Next month"
              className="p-1.5 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] text-[#3B3028] disabled:opacity-40 cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Mode View Switcher: Day / Month / Year */}
          <div className="grid grid-cols-3 gap-1 bg-[#EDE3D2] p-1 rounded-lg my-2.5 text-[11px] font-semibold">
            {(
              [
                { id: "years", label: `Year (${viewYear})` },
                { id: "months", label: SHORT_MONTHS[viewMonth] },
                { id: "days", label: "Calendar" },
              ] as { id: PopoverView; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`py-1 rounded-md transition cursor-pointer ${
                  view === tab.id
                    ? "bg-[#8B5E3C] text-[#F5EFE3] shadow-2xs"
                    : "text-[#3B3028] hover:bg-[#FAF6EE]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* YEAR GRID VIEW */}
          {view === "years" && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1">
                {eraRanges.map((era) => (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => setEraFilter(era.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      eraFilter === era.id
                        ? "bg-[#5C6B45] text-[#F5EFE3]"
                        : "bg-white border border-[#D9C5A3] text-[#3B3028] hover:bg-[#EDE3D2]"
                    }`}
                  >
                    {era.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {visibleYears.map((y) => {
                  const isActive = y === viewYear;
                  const isSelected = selectedParsed?.year === y;
                  return (
                    <button
                      key={y}
                      ref={isActive ? activeYearRef : undefined}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setView("months");
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isSelected || isActive
                          ? "bg-[#8B5E3C] text-[#F5EFE3]"
                          : "bg-white border border-[#D9C5A3]/70 text-[#3B3028] hover:bg-[#EDE3D2]"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MONTH GRID VIEW */}
          {view === "months" && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {SHORT_MONTHS.map((mName, idx) => {
                const isDisabled = toISO(viewYear, idx, 1) > effectiveMaxDate;
                const isCurrent = viewMonth === idx;
                return (
                  <button
                    key={mName}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      setViewMonth(idx);
                      setView("days");
                    }}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                      isCurrent
                        ? "bg-[#8B5E3C] text-[#F5EFE3]"
                        : "bg-white border border-[#D9C5A3]/70 text-[#3B3028] hover:bg-[#EDE3D2]"
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          )}

          {/* CALENDAR DAY GRID VIEW */}
          {view === "days" && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#6E5D50] pb-1">
                {WEEKDAYS.map((wd) => (
                  <div key={wd}>{wd}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1;
                  const iso = toISO(viewYear, viewMonth, day);
                  const isDisabled = iso > effectiveMaxDate;
                  const isSelected =
                    selectedParsed?.year === viewYear &&
                    selectedParsed?.month === viewMonth &&
                    selectedParsed?.day === day;
                  const isToday = iso === todayISO;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectDay(day)}
                      className={`h-8 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-[#8B5E3C] text-[#F5EFE3] shadow-2xs"
                          : isToday
                          ? "bg-white border border-[#5C6B45] text-[#3E492D] hover:bg-[#EEF2E7]"
                          : "text-[#3B3028] hover:bg-[#EDE3D2]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Hint & Clear */}
          <div className="mt-3 pt-2.5 border-t border-[#E9DEC8] flex items-center justify-between text-[11px]">
            <span className="text-[#6E5D50]">Type DD/MM/YYYY or tap Year → Month → Day</span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 font-semibold text-[#8B5E3C] hover:underline cursor-pointer shrink-0 ml-2"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
