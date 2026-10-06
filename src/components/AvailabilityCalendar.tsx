import { ChevronLeft, ChevronRight } from 'lucide-react';

// Fechas como texto "YYYY-MM-DD" (America/Bogota); la aritmética usa UTC para no depender de la zona del navegador.
const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTH_FORMAT = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const pad = (value: number) => String(value).padStart(2, '0');

export const monthOf = (date: string): string => date.slice(0, 7);
export function shiftMonth(month: string, delta: number): string {
  const [year, index] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, index - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`;
}
export function monthRange(month: string): { from: string; to: string } {
  const [year, index] = month.split('-').map(Number);
  return { from: `${month}-01`, to: `${month}-${pad(new Date(Date.UTC(year, index, 0)).getUTCDate())}` };
}
function monthCells(month: string): (string | null)[] {
  const [year, index] = month.split('-').map(Number);
  const leading = (new Date(Date.UTC(year, index - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return [...Array<null>(leading).fill(null), ...Array.from({ length: days }, (_, day) => `${month}-${pad(day + 1)}`)];
}

interface Props {
  month: string;
  minDate: string;
  availableDays: Record<string, number>;
  selectedDate: string;
  isLoading: boolean;
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
}

export function AvailabilityCalendar({ month, minDate, availableDays, selectedDate, isLoading, onMonthChange, onSelectDate }: Props) {
  const [year, index] = month.split('-').map(Number);
  const formatted = MONTH_FORMAT.format(new Date(Date.UTC(year, index - 1, 1)));
  const title = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  const canGoBack = month > monthOf(minDate);
  return <section aria-label="Calendario de disponibilidad" className="p-3 sm:p-4 rounded-card border border-line bg-surface">
    <header className="flex items-center justify-between mb-3">
      <button type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} disabled={!canGoBack} aria-label="Mes anterior" className="grid place-items-center w-10 h-10 rounded-xl text-ink-soft hover:bg-sunken disabled:opacity-30 disabled:pointer-events-none cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
      <strong className="font-display text-xl font-normal text-ink">{title}</strong>
      <button type="button" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Mes siguiente" className="grid place-items-center w-10 h-10 rounded-xl text-ink-soft hover:bg-sunken cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
    </header>
    <div className={`grid grid-cols-7 gap-1 text-center transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
      {WEEKDAYS.map((day) => <span key={day} className="text-[10px] font-medium tracking-[0.12em] text-muted uppercase py-1.5">{day}</span>)}
      {monthCells(month).map((date, position) => {
        if (!date) return <span key={`empty-${position}`} />;
        const slots = date >= minDate ? availableDays[date] ?? 0 : 0;
        const isSelected = date === selectedDate;
        const label = `${date}: ${slots ? `${slots} horarios disponibles` : 'sin disponibilidad'}`;
        return <button type="button" key={date} disabled={!slots || isLoading} aria-pressed={isSelected} aria-label={label} onClick={() => onSelectDate(date)}
          className={`relative h-11 rounded-xl text-sm tabular transition-[background-color,color,transform] duration-150 ${isSelected ? 'bg-accent text-white font-semibold shadow-[0_6px_16px_-8px_rgb(15_92_87/0.8)]' : slots ? 'bg-accent-soft text-accent-ink font-semibold hover:bg-accent/15 active:scale-95 cursor-pointer' : 'text-line-strong cursor-not-allowed'}`}>
          {Number(date.slice(8))}
          {slots > 0 && !isSelected && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
        </button>;
      })}
    </div>
    <p className="mt-3 flex items-center gap-2 text-xs text-muted" aria-live="polite"><span aria-hidden="true" className="w-3 h-3 rounded bg-accent-soft border border-accent/30" />{isLoading ? 'Consultando días disponibles…' : 'Los días resaltados tienen horarios disponibles.'}</p>
  </section>;
}
