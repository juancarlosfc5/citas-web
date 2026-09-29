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
  return <section aria-label="Calendario de disponibilidad" className="p-4 rounded-xl border border-slate-200 bg-white">
    <header className="flex items-center justify-between mb-3">
      <button type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} disabled={!canGoBack} aria-label="Mes anterior" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
      <strong className="text-sm font-semibold text-slate-900">{title}</strong>
      <button type="button" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Mes siguiente" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
    </header>
    <div className="grid grid-cols-7 gap-1 text-center">
      {WEEKDAYS.map((day) => <span key={day} className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase py-1">{day}</span>)}
      {monthCells(month).map((date, position) => {
        if (!date) return <span key={`empty-${position}`} />;
        const slots = date >= minDate ? availableDays[date] ?? 0 : 0;
        const isSelected = date === selectedDate;
        const label = `${date}: ${slots ? `${slots} horarios disponibles` : 'sin disponibilidad'}`;
        return <button type="button" key={date} disabled={!slots || isLoading} aria-pressed={isSelected} aria-label={label} onClick={() => onSelectDate(date)}
          className={`relative h-10 rounded-lg text-xs font-medium transition-colors ${isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-500/20' : slots ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-slate-300 cursor-not-allowed'}`}>
          {Number(date.slice(8))}
          {slots > 0 && !isSelected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />}
        </button>;
      })}
    </div>
    <p className="mt-3 text-[11px] text-slate-500">{isLoading ? 'Consultando días disponibles…' : 'Los días resaltados tienen horarios disponibles.'}</p>
  </section>;
}
