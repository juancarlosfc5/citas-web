import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Clock, MapPin, Shield, Stethoscope, X } from 'lucide-react';
import { appointmentsApi, catalogsApi, SchedulingApiError, schedulingErrorMessage } from '../api/schedulingApi';
import { bogotaToday, localTime } from '../api/bogotaTime';
import { AvailabilityCalendar, monthOf, monthRange } from './AvailabilityCalendar';
import type { Appointment, AvailableProfessional, CatalogItem, Specialty } from '../types';

interface Props { isOpen: boolean; onClose: () => void; onAppointmentBooked: (appointment: Appointment) => void; }
type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;
const SLOT_TAKEN_MESSAGE = 'La franja seleccionada dejó de estar disponible. Elige otro horario.';
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
  if (!isOpen) return null;

  const canContinue = step === 1 ? Boolean(locationId && specialtyId) : step === 2 ? Boolean(startAt && selectedProfessional) : true;
  const close = () => { setStep(1); setBooked(null); setReason(''); setError(''); onClose(); };
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

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Agendar cita">
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
      <header className="px-6 py-4 border-b border-slate-100 flex justify-between bg-slate-50/50"><div><span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase">Agendar nueva cita</span><h3 className="text-lg font-bold text-slate-900">{booked ? 'Resultado' : `Paso ${step} de ${TOTAL_STEPS}`}</h3></div><button type="button" onClick={close} className="p-2 text-slate-400 hover:text-slate-700" aria-label="Cerrar"><X /></button></header>
      <div className="h-1.5 bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${booked ? 100 : (step / TOTAL_STEPS) * 100}%` }} /></div>
      <main className="p-6 overflow-y-auto space-y-4 flex-1">
        {error && <p role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</p>}
        {booked && <div className="space-y-3 text-center"><CheckCircle2 className={`mx-auto w-10 h-10 ${booked.status === 'APPROVED' ? 'text-emerald-600' : 'text-blue-600'}`} /><p className="text-base font-bold text-slate-900">{STATUS_LABEL[booked.status] ?? booked.status}</p><p className="text-xs text-slate-500">Estado: <strong>{booked.status}</strong> · {booked.specialtyName} · {date} {localTime(booked.startAt)}</p></div>}

        {!booked && step === 1 && <>
          <p className="text-sm text-slate-600">¿Qué especialidad necesitas? Luego elige la sede.</p>
          {loading && !specialties.length && <p className="text-sm text-slate-500">Cargando especialidades…</p>}
          <div role="radiogroup" aria-label="Especialidad" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {specialties.map((item) => <button type="button" role="radio" aria-checked={specialtyId === item.id} key={item.id} onClick={() => setSpecialtyId(item.id)} className={`p-3 text-left rounded-xl border text-xs transition-colors ${specialtyId === item.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'border-slate-200 hover:bg-slate-50'}`}><Stethoscope className="inline w-3.5 h-3.5 mr-1 text-blue-600" /><strong className="text-slate-900">{item.name}</strong><span className="block text-[11px] text-slate-500 mt-0.5">{item.durationMinutes} min</span></button>)}
          </div>
          <label className="block text-xs font-semibold text-slate-700">Sede<select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="mt-2 w-full p-3 border border-slate-200 rounded-xl bg-white"><option value="">Selecciona una sede</option>{locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </>}

        {!booked && step === 2 && <>
          <p className="text-sm text-slate-600">{selectedSpecialty?.name} · {locationName}. Elige un día resaltado y luego una hora.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <AvailabilityCalendar month={month} minDate={today} availableDays={availableDays} selectedDate={date} isLoading={daysLoading} onMonthChange={setMonth} onSelectDate={setDate} />
            <section aria-label="Horarios disponibles" className="space-y-3">
              {!date && <p className="p-5 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">{Object.keys(availableDays).length || daysLoading ? 'Selecciona un día para ver sus horarios.' : 'No hay días disponibles este mes. Prueba el mes siguiente.'}</p>}
              {date && loading && <p className="text-sm text-slate-500">Consultando horarios…</p>}
              {date && !loading && !professionals.length && <p className="p-5 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">No quedan horarios para este día.</p>}
              {date && professionals.map((professional) => <div key={professional.id} className="p-3 rounded-xl border border-slate-200"><strong className="text-sm text-slate-900">{professional.name}</strong><div className="mt-2 grid grid-cols-3 gap-2">{professional.slots.map((slot) => { const isChosen = professionalId === professional.id && startAt === slot.startAt; return <button type="button" key={slot.startAt} aria-pressed={isChosen} onClick={() => pickSlot(professional, slot.startAt)} className={`py-2 px-2 rounded-lg border text-xs ${isChosen ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Clock className="inline w-3 h-3 mr-1" />{localTime(slot.startAt)}</button>; })}</div></div>)}
            </section>
          </div>
        </>}

        {!booked && step === 3 && <><div className="p-4 rounded-xl bg-gradient-to-br from-[#07152B] to-[#0E2952] text-white"><p className="text-xs text-blue-200">Resumen de solicitud</p><p className="font-semibold mt-1">{selectedProfessional?.name}</p><p className="text-xs text-slate-300">{selectedSpecialty?.name} · {selectedSpecialty?.durationMinutes} min</p><p className="text-xs text-slate-300 mt-2"><MapPin className="inline w-3 h-3 mr-1" />{locationName}</p><p className="text-xs text-slate-300 mt-1"><Calendar className="inline w-3 h-3 mr-1" />{date} · {startAt && localTime(startAt)}</p></div><label className="block text-xs font-semibold text-slate-700">Motivo de consulta<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="Describe brevemente el motivo (opcional)" /></label><p className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800"><Shield className="inline w-4 h-4 mr-2 text-blue-600" />Las citas generales se aprueban de inmediato. Las especializadas quedan pendientes de decisión administrativa.</p></>}
      </main>
      <footer className="px-6 py-4 border-t border-slate-100 flex justify-between bg-slate-50/50">{booked ? <button type="button" onClick={close} className="ml-auto px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl">Cerrar</button> : <><button type="button" disabled={step === 1 || loading} onClick={() => setStep((current) => (current - 1) as Step)} className="px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40">← Anterior</button>{step < TOTAL_STEPS ? <button type="button" disabled={!canContinue || loading} onClick={() => setStep((current) => (current + 1) as Step)} className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50">Continuar <ChevronRight className="inline w-3.5 h-3.5" /></button> : <button type="button" disabled={loading} onClick={finish} className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50"><CheckCircle2 className="inline w-4 h-4 mr-1" />Confirmar</button>}</>}</footer>
    </div>
  </div>;
}
