"use client";

import { useState, useMemo } from "react";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { formatPeriode } from "@/lib/constants/triwulan";
import { Calendar } from "@/components/ui/calendar";
import { EmptyState } from "@/components/shared/empty-state";
import type { Triwulan } from "@/generated/prisma/enums";

export type CalendarEvent = {
  id: string;
  dialogId: string;
  date: string;
  pegawaiName: string;
  npp: string;
  triwulan: Triwulan;
  tahun: number;
  kind?: "reviu" | "dialog";
  status?: string;
};

interface EvaluationCalendarProps {
  events: CalendarEvent[];
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function EvaluationCalendar({ events }: EvaluationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Extract dates that have events
  const eventDates = useMemo(() => {
    return events.map(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [events]);

  const getEventsForDay = (d: Date) => {
    return events.filter((e) => {
      const ed = new Date(e.date);
      return ed.getDate() === d.getDate() && 
             ed.getMonth() === d.getMonth() && 
             ed.getFullYear() === d.getFullYear();
    });
  };

  const getEventsForMonth = (m: Date) => {
    return events.filter((e) => {
      const ed = new Date(e.date);
      return ed.getMonth() === m.getMonth() && ed.getFullYear() === m.getFullYear();
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const displayedEvents = selectedDate ? getEventsForDay(selectedDate) : getEventsForMonth(currentMonth);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar View */}
      <div className="shrink-0 border border-outline rounded-lg bg-surface flex flex-col p-4 w-full lg:w-auto overflow-hidden items-center justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="rounded-md"
          modifiers={{
            hasEvent: eventDates
          }}
          modifiersClassNames={{
            hasEvent: "border-2 border-primary font-bold text-primary bg-primary/10"
          }}
        />
        {/* <div className="text-xs text-ink-muted mt-2 text-center w-full">
          * Tanggal yang di-highlight memiliki jadwal evaluasi
        </div> */}
      </div>

      {/* Selected Day Details */}
      <div className="flex-1 flex flex-col border border-outline rounded-lg bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink flex items-center gap-2">
            <CalendarBlank size={20} className="text-primary" />
            {selectedDate 
              ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` 
              : `Jadwal Bulan ${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
          </h3>
          {selectedDate && (
            <button 
              onClick={() => setSelectedDate(undefined)}
              className="text-xs text-primary hover:underline"
            >
              Tampilkan Semua Bulan Ini
            </button>
          )}
        </div>
        
        {displayedEvents.length === 0 ? (
          <EmptyState
            variant="calendar"
            title="Tidak ada jadwal evaluasi"
            description={`Belum ada jadwal evaluasi pada ${selectedDate ? "tanggal" : "bulan"} ini.`}
            className="flex-1 border-none bg-transparent py-6"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {displayedEvents.map((ev) => {
              const d = new Date(ev.date);
              const isDialog = ev.kind === "dialog";
              return (
                <li key={`${ev.kind ?? "event"}-${ev.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-outline-strong bg-surface-muted">
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink truncate">{ev.pegawaiName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isDialog
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        }`}
                      >
                        {isDialog ? "Jadwal Dialog" : "Evaluasi Reviu"}
                      </span>
                    </div>
                    <span className="text-xs text-ink-muted">
                      {d.getDate()} {MONTHS[d.getMonth()]} · NPP: {ev.npp} · {formatPeriode(ev.triwulan, ev.tahun)}
                    </span>
                  </div>
                  <Link 
                    href={`/atasan/dialog/${ev.dialogId}`}
                    className="shrink-0 px-3 py-1.5 bg-white border border-outline rounded text-xs font-semibold text-ink hover:border-primary hover:text-primary transition-colors text-center"
                  >
                    Lihat Dialog
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
