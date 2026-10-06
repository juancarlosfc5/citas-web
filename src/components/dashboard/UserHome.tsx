import { useEffect, useState } from 'react';
import { CalendarPlus, CalendarX2, History, MapPin, Phone, RefreshCw, Stethoscope } from 'lucide-react';
import { appointmentsApi, profileApi, schedulingErrorMessage } from '../../api/schedulingApi';
import { bogotaToday, formatLocal } from '../../api/bogotaTime';
import type { Appointment, User } from '../../types';
import { Button } from '../ui/Button';
import { TextField } from '../ui/Field';
import { Alert, Card, EmptyState, SectionHeader, Skeleton } from '../ui/Surface';
import { StatusBadge } from '../ui/StatusBadge';
import { DateTile, dateParts } from '../ui/DateTile';

const today = bogotaToday();
const fmt = formatLocal;

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function NextAppointment({ appointment }: { appointment: Appointment }) {
  const parts = dateParts(appointment.startAt);
  return (
    <section aria-label="Próxima cita" className="relative overflow-hidden rounded-card bg-night text-white p-5 sm:p-7 shadow-lift">
      <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
      <div className="absolute -right-16 -bottom-24 w-72 h-72 rounded-full bg-accent/50 blur-[80px] pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.16em] uppercase text-white/60">Tu próxima cita</p>
          <p className="font-display text-[2rem] sm:text-[2.5rem] leading-none mt-3">{appointment.specialtyName}</p>
          <p className="mt-3 text-sm text-white/75">{appointment.professionalName}</p>
          <p className="mt-1 text-sm text-white/60 flex items-start gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{appointment.locationName}</p>
        </div>
        {parts && (
          <div className="flex items-end gap-4 sm:text-right shrink-0">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">{parts.weekday} {parts.day} {parts.month}</p>
              <p className="font-display text-[3rem] sm:text-[3.5rem] leading-[0.85] tabular mt-1">{parts.time}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AppointmentSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-card border border-line">
      <Skeleton className="w-14 h-16 rounded-2xl" />
      <div className="flex-1 space-y-2.5 py-1"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/4" /></div>
    </div>
  );
}

export function UserHome({ user, open, version }: { user: User; open: () => void; version: number }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]); const [phone, setPhone] = useState(user.phone ?? ''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [history, setHistory] = useState<Record<string, string>>({});
  const load = () => { setLoading(true); appointmentsApi.mine().then(setAppointments).catch((cause) => setError(schedulingErrorMessage(cause))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [version]);
  useEffect(() => { profileApi.mine().then((profile) => setPhone(profile.phone ?? '')).catch(() => undefined); }, []);
  const cancel = async (id: string) => { const reason = window.prompt('Motivo de cancelación (opcional)') ?? undefined; try { await appointmentsApi.cancel(id, reason); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } };
  const reschedule = async (id: string) => { const date = window.prompt('Nueva fecha (YYYY-MM-DD)', today); const startTime = window.prompt('Nueva hora (HH:mm)', '08:00'); if (!date || !startTime) return; try { await appointmentsApi.reschedule(id, { date, startTime }); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } };
  const showHistory = async (id: string) => { try { const rows = await appointmentsApi.history(id); setHistory((current) => ({ ...current, [id]: rows.map((row) => `${row.status} · ${fmt(row.changedAt)}`).join('\n') })); } catch (cause) { setError(schedulingErrorMessage(cause)); } };

  const upcoming = appointments
    .filter((a) => (a.status === 'APPROVED' || a.status === 'REQUESTED') && a.startAt.slice(0, 10) >= today)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))[0];

  return (
    <div className="grid gap-5 lg:gap-6 lg:grid-cols-[18.75rem_minmax(0,1fr)] xl:grid-cols-[21.25rem_minmax(0,1fr)] items-start">
      <div className="lg:col-span-2 animate-rise">
        <p className="text-sm text-muted">Hola,</p>
        <h1 className="font-display text-[2.5rem] sm:text-[3.25rem] leading-[0.95] tracking-[-0.015em] text-ink">{user.name}</h1>
      </div>

      <aside className="order-2 lg:order-1 lg:sticky lg:top-24 space-y-5">
        <Card>
          <div className="flex items-center gap-3.5">
            <span aria-hidden="true" className="grid place-items-center w-12 h-12 rounded-2xl bg-accent-soft text-accent-ink font-semibold">{initials(user.name)}</span>
            <div className="min-w-0">
              <h2 className="font-medium text-ink truncate">Mi perfil</h2>
              <p className="text-sm text-muted truncate">{user.email}</p>
            </div>
          </div>
          <form onSubmit={async (event) => { event.preventDefault(); try { await profileApi.update(phone); } catch (cause) { setError(schedulingErrorMessage(cause)); } }} className="mt-5 pt-5 border-t border-line space-y-3">
            <TextField id="profile-phone" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" icon={<Phone />} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button type="submit" variant="dark" fullWidth>Guardar teléfono</Button>
          </form>
        </Card>
      </aside>

      <section className="order-1 lg:order-2 space-y-5 min-w-0">
        {upcoming && <NextAppointment appointment={upcoming} />}

        <Card>
          <SectionHeader title="Mis citas" description="Gestiona tus solicitudes y citas confirmadas." />
          <div className="mt-6 space-y-3">
            {error && <Alert>{error}</Alert>}
            {loading ? (
              <div aria-busy="true" aria-label="Cargando citas" className="space-y-3"><AppointmentSkeleton /><AppointmentSkeleton /></div>
            ) : appointments.length ? (
              <ul className="space-y-3">
                {appointments.map((a) => (
                  <li key={a.id}>
                    <article className="group flex gap-3.5 sm:gap-5 p-3.5 sm:p-4 rounded-card border border-line bg-canvas/40 hover:bg-surface hover:border-line-strong transition-colors">
                      <DateTile value={a.startAt} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                          <h3 className="font-medium text-ink text-[15px] leading-snug">{a.specialtyName}</h3>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="mt-1 text-[13px] text-ink-soft flex items-center gap-1.5 min-w-0"><Stethoscope className="w-3.5 h-3.5 shrink-0 text-muted" /><span className="truncate">{a.professionalName}</span></p>
                        <p className="mt-0.5 text-[13px] text-muted flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{a.locationName}</span></p>
                        <p className="mt-1 text-[13px] text-ink tabular font-medium">{fmt(a.startAt)}</p>
                        {a.status === 'APPROVED' && (
                          <div className="flex flex-wrap gap-1.5 mt-3 -ml-2">
                            <Button size="sm" variant="ghost" className="text-accent hover:text-accent-strong" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => reschedule(a.id)}>Reprogramar</Button>
                            <Button size="sm" variant="ghost" className="text-danger hover:text-danger" icon={<CalendarX2 className="w-3.5 h-3.5" />} onClick={() => cancel(a.id)}>Cancelar</Button>
                            <Button size="sm" variant="ghost" icon={<History className="w-3.5 h-3.5" />} onClick={() => showHistory(a.id)}>Historial</Button>
                          </div>
                        )}
                        {history[a.id] && <pre className="mt-3 p-3 rounded-field bg-sunken text-[11px] leading-relaxed text-ink-soft whitespace-pre-wrap font-sans tabular">{history[a.id]}</pre>}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CalendarPlus className="w-5 h-5" />} title="Aún no tienes citas registradas." description="Elige especialidad, sede y horario en tres pasos." action={<Button onClick={open} icon={<CalendarPlus className="w-4 h-4" />}>Agendar mi primera cita</Button>} />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
