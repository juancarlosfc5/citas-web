// Presentación de fechas locales "YYYY-MM-DDTHH:mm" sin depender de la zona del navegador.
const PARTS = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export type DateParts = { day: string; month: string; weekday: string; year: string; time: string };

export function dateParts(value: string): DateParts | null {
  const match = PARTS.exec(value);
  if (!match) return null;
  const [, year, month, day, time] = match;
  const weekday = WEEKDAYS[new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()];
  return { day: String(Number(day)), month: MONTHS[Number(month) - 1], weekday, year, time };
}

export function DateTile({ value, tone = 'light' }: { value: string; tone?: 'light' | 'accent' }) {
  const parts = dateParts(value);
  if (!parts) return null;
  const toneCls = tone === 'accent' ? 'bg-accent text-white border-transparent' : 'bg-surface text-ink border-line';
  return (
    <div aria-hidden="true" className={`flex flex-col items-center justify-center shrink-0 w-14 h-16 sm:w-16 sm:h-[4.5rem] rounded-2xl border ${toneCls}`}>
      <span className={`text-[10px] uppercase tracking-[0.12em] ${tone === 'accent' ? 'text-white/70' : 'text-muted'}`}>{parts.weekday}</span>
      <span className="font-display text-[1.9rem] sm:text-[2.1rem] leading-[0.9] tabular">{parts.day}</span>
      <span className={`text-[10px] uppercase tracking-[0.12em] ${tone === 'accent' ? 'text-white/70' : 'text-muted'}`}>{parts.month}</span>
    </div>
  );
}
