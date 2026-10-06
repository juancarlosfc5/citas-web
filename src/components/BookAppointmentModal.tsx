import React, { useEffect, useRef, useState } from 'react';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Clock3, MapPin, Shield, Stethoscope, X } from 'lucide-react';
import { appointmentsApi, catalogsApi, SchedulingApiError, schedulingErrorMessage } from '../api/schedulingApi';
import { bogotaToday, localTime } from '../api/bogotaTime';
import { AvailabilityCalendar, monthOf, monthRange } from './AvailabilityCalendar';
import type { Appointment, AvailableProfessional, CatalogItem, Specialty } from '../types';
import { Button } from './ui/Button';
import { SelectField, TextAreaField } from './ui/Field';
import { Alert, EmptyState } from './ui/Surface';
import { StatusBadge } from './ui/StatusBadge';

interface Props { isOpen: boolean; onClose: () => void; onAppointmentBooked: (appointment: Appointment) => void; }
type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;
const SLOT_TAKEN_MESSAGE = 'La franja seleccionada dejó de estar disponible. Elige otro horario.';
const STEP_TITLES: Record<Step, string> = { 1: 'Especialidad y sede', 2: 'Día y horario', 3: 'Confirmación' };
const STATUS_LABEL: Record<string, string> = { APPROVED: 'Cita aprobada', REQUESTED: 'Solicitud enviada a revisión administrativa' };

export function BookAppointmentModal({ isOpen, onClose, onAppointmentBooked }: Props) {
  const today = bogotaToday();
  const [step, setStep] = useState<Step>(1);
  const [locations, setLocations] = useState<CatalogItem[]>([]); const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [locationId, setLocationId] = useState(''); const [specialtyId, setSpecialtyId] = useState('');
  const [month, setMonth] = useState(monthOf(today)); const [availableDays, setAvailableDays] = useState<Record<string, number>>({});
  const [date, setDate] = useState(''); const [professionals, setProfessionals] = useState<AvailableProfessional[]>([]);
  const [professionalId, setProfessionalId] = useState(''); const [startAt, setStartAt] = useState(''); const [reason, setReason] = useState('');
  const [booked, setBooked] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false); const [daysLoading, setDaysLoading] = useState(false); const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  loadingRef.current = loading;
  const selectedProfessional = professionals.find((professional) => professional.id === professionalId);
  const selectedSpecialty = specialties.find((specialty) => specialty.id === specialtyId);
  const locationName = locations.find((item) => item.id === locationId)?.name;

  useEffect(() => { if (!isOpen) return; setLoading(true); setError(''); Promise.all([catalogsApi.locations(), catalogsApi.specialties()]).then(([nextLocations, nextSpecialties]) => { setLocations(nextLocations); setSpecialties(nextSpecialties.filter((item) => item.active !== false)); }).catch((cause) => setError(schedulingErrorMessage(cause))).finally(() => setLoading(false)); }, [isOpen]);

  const loadDays = () => {
    if (!locationId || !specialtyId) { setAvailableDays({}); return Promise.resolve(); }
    const range = monthRange(month); const from = range.from < today ? today : range.from;
    if (range.to < from) { setAvailableDays({}); return Promise.resolve(); }
    setDaysLoading(true);
    return appointmentsApi.availableDays({ locationId, specialtyId, from, to: range.to })
      .then((days) => setAvailableDays(Object.fromEntries(days.map((day) => [day.date, day.slots]))))
      .catch((cause) => setError(schedulingErrorMessage(cause))).finally(() => setDaysLoading(false));
  };
  const loadSlots = () => {
    if (!locationId || !specialtyId || !date) { setProfessionals([]); return Promise.resolve(); }
    setLoading(true);
    return appointmentsApi.availability({ locationId, specialtyId, date }).then(setProfessionals).catch((cause) => setError(schedulingErrorMessage(cause))).finally(() => setLoading(false));
  };
  // Abrir el modal o cambiar especialidad, sede o mes invalida día y franja, y reconsulta los días disponibles.
  useEffect(() => { if (!isOpen) return; setDate(''); setProfessionals([]); setProfessionalId(''); setStartAt(''); setError(''); void loadDays(); }, [isOpen, locationId, specialtyId, month]);
  useEffect(() => { if (!isOpen) return; setProfessionalId(''); setStartAt(''); void loadSlots(); }, [date]);

  const close = () => { setStep(1); setBooked(null); setReason(''); setError(''); onClose(); };
  // Esc cierra, el fondo no se desplaza y el foco entra al diálogo al abrir.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trigger = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loadingRef.current) { close(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      // Mantiene el foco dentro del diálogo.
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), select, textarea, input, [tabindex="0"]')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); trigger?.focus?.(); };
  }, [isOpen]);
  // Cada paso empieza arriba para que su instrucción quede visible.
  useEffect(() => { bodyRef.current?.scrollTo?.({ top: 0 }); }, [step, booked]);
  if (!isOpen) return null;

  const canContinue = step === 1 ? Boolean(locationId && specialtyId) : step === 2 ? Boolean(startAt && selectedProfessional) : true;
  const pickSlot = (professional: AvailableProfessional, slotStart: string) => { setProfessionalId(professional.id); setStartAt(slotStart); };
  const finish = async () => {
    if (!professionalId || !locationId || !specialtyId || !startAt || !selectedProfessional || !selectedSpecialty) return;
    setLoading(true); setError('');
    try {
      const appointment = await appointmentsApi.create({ professionalId, locationId, specialtyId, date, startTime: localTime(startAt), reason: reason.trim() || undefined }, { professionalName: selectedProfessional.name, specialtyName: selectedSpecialty.name, locationName: locationName ?? 'Sede seleccionada', durationMinutes: selectedSpecialty.durationMinutes });
      setBooked(appointment); onAppointmentBooked(appointment);
    } catch (cause) {
      if (cause instanceof SchedulingApiError && cause.status === 409) { setStartAt(''); setProfessionalId(''); setStep(2); await Promise.all([loadSlots(), loadDays()]); setError(SLOT_TAKEN_MESSAGE); }
      else setError(schedulingErrorMessage(cause));
    } finally { setLoading(false); }
  };

  // Radiogrupo: las flechas mueven y seleccionan, como un grupo de radio nativo.
  const onRadioKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta || !specialties.length) return;
    event.preventDefault();
    const next = (index + delta + specialties.length) % specialties.length;
    setSpecialtyId(specialties[next].id);
    (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };
  const daysHint = Object.keys(availableDays).length || daysLoading ? 'Selecciona un día para ver sus horarios.' : 'No hay días disponibles este mes. Prueba el mes siguiente.';

  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-night/55 backdrop-blur-[2px] animate-fade" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Agendar cita" className="w-full sm:max-w-3xl h-dvh sm:h-auto sm:max-h-[min(92dvh,860px)] bg-surface sm:rounded-shell shadow-lift flex flex-col overflow-hidden focus:outline-none animate-sheet">
      <header className="px-5 sm:px-7 pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-6 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[11px] font-medium tracking-[0.14em] text-accent uppercase">Agendar nueva cita</span>
          <h3 className="font-display text-[1.9rem] leading-none mt-2 text-ink">{booked ? 'Resultado' : STEP_TITLES[step]}</h3>
          {!booked && <p className="mt-1.5 text-xs text-muted tabular">Paso {step} de {TOTAL_STEPS}</p>}
        </div>
        <button type="button" onClick={close} className="grid place-items-center w-11 h-11 -mr-2 rounded-xl text-muted hover:text-ink hover:bg-sunken shrink-0 cursor-pointer" aria-label="Cerrar"><X className="w-5 h-5" /></button>
      </header>
      <div className="px-5 sm:px-7 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((index) => <span key={index} className={`h-1 rounded-full transition-colors duration-300 ${booked || index <= step ? 'bg-accent' : 'bg-sunken'}`} />)}
      </div>

      <div ref={bodyRef} className="px-5 sm:px-7 py-6 overflow-y-auto overscroll-contain space-y-5 flex-1">
        {error && <Alert>{error}</Alert>}
        {booked && <div className="flex flex-col items-center text-center gap-3 py-6">
          <span className={`grid place-items-center w-14 h-14 rounded-2xl ${booked.status === 'APPROVED' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>{booked.status === 'APPROVED' ? <CheckCircle2 className="w-7 h-7" /> : <Clock3 className="w-7 h-7" />}</span>
          <p className="font-display text-[1.75rem] leading-tight text-ink">{STATUS_LABEL[booked.status] ?? booked.status}</p>
          <StatusBadge status={booked.status} />
          <p className="text-sm text-ink-soft tabular">{booked.specialtyName} · {date} {localTime(booked.startAt)}</p>
        </div>}

        {!booked && step === 1 && <>
          <p className="text-sm text-ink-soft">¿Qué especialidad necesitas? Luego elige la sede.</p>
          {loading && !specialties.length && <div aria-busy="true" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">{[0, 1, 2].map((i) => <span key={i} className="h-[4.5rem] rounded-field bg-sunken animate-pulse" />)}</div>}
          <div role="radiogroup" aria-label="Especialidad" className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-2.5">
            {specialties.map((item, index) => {
              const isChecked = specialtyId === item.id;
              const isTabStop = isChecked || (!specialtyId && index === 0);
              return <button type="button" role="radio" aria-checked={isChecked} key={item.id} tabIndex={isTabStop ? 0 : -1} onClick={() => setSpecialtyId(item.id)} onKeyDown={(event) => onRadioKey(event, index)} className={`flex items-start gap-3 p-3.5 text-left rounded-field border transition-[border-color,background-color,box-shadow] duration-200 cursor-pointer ${isChecked ? 'border-accent bg-accent-soft/70 ring-4 ring-accent/10' : 'border-line hover:border-line-strong hover:bg-canvas'}`}>
                <span className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${isChecked ? 'bg-accent text-white' : 'bg-sunken text-accent'}`}><Stethoscope className="w-4 h-4" /></span>
                <span className="min-w-0"><strong className="block text-sm font-medium text-ink leading-snug">{item.name}</strong><span className="block text-xs text-muted mt-0.5 tabular">{item.durationMinutes} min</span></span>
              </button>;
            })}
          </div>
          <SelectField id="booking-location" label="Sede" icon={<MapPin />} value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">Selecciona una sede</option>{locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
        </>}

        {!booked && step === 2 && <>
          <p className="text-sm text-ink-soft"><strong className="font-medium text-ink">{selectedSpecialty?.name}</strong> · {locationName}. Elige un día resaltado y luego una hora.</p>
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 items-start">
            <AvailabilityCalendar month={month} minDate={today} availableDays={availableDays} selectedDate={date} isLoading={daysLoading} onMonthChange={setMonth} onSelectDate={setDate} />
            <section aria-label="Horarios disponibles" className="space-y-3">
              {!date && <EmptyState icon={<Calendar className="w-5 h-5" />} title={daysHint} />}
              {date && loading && <div aria-busy="true" className="space-y-2">{[0, 1].map((i) => <span key={i} className="block h-24 rounded-card bg-sunken animate-pulse" />)}<p className="text-xs text-muted">Consultando horarios…</p></div>}
              {date && !loading && !professionals.length && <EmptyState icon={<Clock className="w-5 h-5" />} title="No quedan horarios para este día." />}
              {date && professionals.map((professional) => <div key={professional.id} className="p-3.5 rounded-card border border-line">
                <strong className="text-sm font-medium text-ink">{professional.name}</strong>
                <div className="mt-2.5 grid grid-cols-3 min-[420px]:grid-cols-4 md:grid-cols-3 gap-2">
                  {professional.slots.map((slot) => {
                    const isChosen = professionalId === professional.id && startAt === slot.startAt;
                    return <button type="button" key={slot.startAt} aria-pressed={isChosen} onClick={() => pickSlot(professional, slot.startAt)} className={`min-h-11 rounded-xl border text-sm tabular font-medium transition-colors cursor-pointer ${isChosen ? 'border-accent bg-accent text-white' : 'border-line text-ink hover:border-accent/50 hover:bg-accent-soft/60'}`}>{localTime(slot.startAt)}</button>;
                  })}
                </div>
              </div>)}
            </section>
          </div>
        </>}

        {!booked && step === 3 && <>
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-card bg-night text-white">
            <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
            <div className="relative">
              <p className="text-[11px] tracking-[0.14em] uppercase text-white/60">Resumen de solicitud</p>
              <p className="font-display text-[1.75rem] leading-none mt-3">{selectedSpecialty?.name}</p>
              <p className="mt-2 text-sm text-white/75">{selectedProfessional?.name} · <span className="tabular">{selectedSpecialty?.durationMinutes} min</span></p>
              <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                <p className="flex items-start gap-2 text-white/80"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-accent-glow" />{locationName}</p>
                <p className="flex items-center gap-2 text-white/80 tabular"><Calendar className="w-4 h-4 shrink-0 text-accent-glow" />{date} · {startAt && localTime(startAt)}</p>
              </div>
            </div>
          </div>
          <TextAreaField id="booking-reason" label="Motivo de consulta" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Describe brevemente el motivo (opcional)" />
          <p className="flex gap-2.5 p-3.5 rounded-field bg-info-soft text-info text-[13px] leading-snug"><Shield className="w-4 h-4 mt-0.5 shrink-0" />Las citas generales se aprueban de inmediato. Las especializadas quedan pendientes de decisión administrativa.</p>
        </>}
      </div>

      <footer className="px-5 sm:px-7 pt-4 safe-bottom sm:pb-5 border-t border-line flex items-center justify-between gap-3 bg-surface">
        {booked ? <Button size="lg" className="ml-auto w-full sm:w-auto" onClick={close}>Cerrar</Button> : <>
          <Button variant="ghost" size="lg" disabled={step === 1 || loading} onClick={() => setStep((current) => (current - 1) as Step)} icon={<ChevronLeft className="w-4 h-4" />}>Anterior</Button>
          {step < TOTAL_STEPS
            ? <Button size="lg" className="flex-1 sm:flex-none" disabled={!canContinue || loading} onClick={() => setStep((current) => (current + 1) as Step)}>Continuar <ChevronRight className="w-4 h-4" /></Button>
            : <Button size="lg" className="flex-1 sm:flex-none" isLoading={loading} onClick={finish} icon={<CheckCircle2 className="w-4 h-4" />}>Confirmar</Button>}
        </>}
      </footer>
    </div>
  </div>;
}
