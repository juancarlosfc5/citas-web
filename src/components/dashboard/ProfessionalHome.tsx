import { useEffect, useState } from 'react';
import { CalendarClock, CalendarDays, MapPin } from 'lucide-react';
import { availabilityApi, catalogsApi, professionalApi, schedulingErrorMessage } from '../../api/schedulingApi';
import { bogotaToday, formatLocal } from '../../api/bogotaTime';
import type { Appointment, AvailabilityBlock, CatalogItem } from '../../types';
import { Button } from '../ui/Button';
import { SelectField, TextField } from '../ui/Field';
import { Alert, Card, EmptyState, SectionHeader } from '../ui/Surface';
import { DateTile } from '../ui/DateTile';

const today = bogotaToday();
const fmt = formatLocal;

export function ProfessionalHome() {
  const [locations, setLocations] = useState<CatalogItem[]>([]); const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]); const [appointments, setAppointments] = useState<Appointment[]>([]); const [locationId, setLocationId] = useState(''); const [startAt, setStartAt] = useState(''); const [endAt, setEndAt] = useState(''); const [error, setError] = useState(''); const [editingId, setEditingId] = useState<string | null>(null);
  const resetForm = () => { setEditingId(null); setLocationId(''); setStartAt(''); setEndAt(''); };
  const startEdit = (b: AvailabilityBlock) => { setEditingId(b.id); setLocationId(b.locationId); setStartAt(b.startAt.slice(0, 16)); setEndAt(b.endAt.slice(0, 16)); };
  const load = () => { availabilityApi.listMine().then(setBlocks).catch((cause) => setError(schedulingErrorMessage(cause))); professionalApi.appointments({ from: today, to: today }).then(setAppointments).catch((cause) => setError(schedulingErrorMessage(cause))); };
  useEffect(() => { catalogsApi.locations().then(setLocations).catch((cause) => setError(schedulingErrorMessage(cause))); load(); }, []);

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="animate-rise">
        <p className="text-sm text-muted">Profesional</p>
        <h1 className="font-display text-[2.5rem] sm:text-[3.25rem] leading-[0.95] tracking-[-0.015em]">Mi agenda</h1>
      </div>
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 lg:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
        <Card>
          <SectionHeader title="Mi agenda de hoy" description="Citas aprobadas para la jornada." />
          <div className="mt-5">
            {appointments.length ? (
              <ul className="space-y-3">
                {appointments.map((a) => (
                  <li key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-4 rounded-card border border-line bg-canvas/40">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <DateTile value={a.startAt} />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{a.specialtyName}</p>
                        <p className="text-[13px] text-muted tabular">{fmt(a.startAt)}</p>
                        <p className="text-[13px] text-muted truncate">{a.locationName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 sm:flex-none" onClick={async () => { try { await professionalApi.close(a.id, 'COMPLETED'); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } }}>Atendido</Button>
                      <Button size="sm" variant="secondary" className="flex-1 sm:flex-none text-danger" onClick={async () => { try { await professionalApi.close(a.id, 'NO_SHOW'); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } }}>No asistió</Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CalendarDays className="w-5 h-5" />} title="No tienes citas aprobadas para hoy." />
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader title={editingId ? 'Editar bloque' : 'Publicar disponibilidad'} description="Define sede y franja horaria." />
          <form onSubmit={async (event) => { event.preventDefault(); setError(''); try { if (editingId) await availabilityApi.update(editingId, { locationId, startAt, endAt }); else await availabilityApi.create({ locationId, startAt, endAt }); resetForm(); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } }} className="mt-5 space-y-3.5">
            <SelectField id="block-location" label="Sede" required icon={<MapPin />} value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">Selecciona una sede</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</SelectField>
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3.5">
              <TextField id="block-start" label="Inicio" required type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              <TextField id="block-end" label="Fin" required type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
            <Button type="submit" size="lg" fullWidth>{editingId ? 'Guardar cambios' : 'Publicar bloque'}</Button>
            {editingId && <Button variant="ghost" fullWidth onClick={resetForm}>Cancelar edición</Button>}
          </form>
          <ul className="mt-6 pt-5 border-t border-line space-y-2">
            {blocks.map((b) => (
              <li key={b.id} className={`flex items-center justify-between gap-3 p-3 rounded-field border text-sm ${editingId === b.id ? 'border-accent bg-accent-soft/50' : 'border-line bg-canvas/40'}`}>
                <span className="flex items-start gap-2.5 min-w-0">
                  <CalendarClock className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block truncate">{b.locationName ?? locations.find((l) => l.id === b.locationId)?.name ?? b.locationId}</span>
                    <span className="block text-[13px] text-muted tabular">{fmt(b.startAt)} — {b.endAt.slice(11, 16)}</span>
                  </span>
                </span>
                <span className="flex flex-col sm:flex-row gap-0.5 shrink-0">
                  <button type="button" onClick={() => startEdit(b)} className="min-h-9 px-2 rounded-lg text-[13px] font-medium text-accent hover:bg-accent-soft cursor-pointer">Editar</button>
                  <button type="button" onClick={async () => { setError(''); try { await availabilityApi.remove(b.id); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } }} className="min-h-9 px-2 rounded-lg text-[13px] font-medium text-danger hover:bg-danger-soft cursor-pointer">Eliminar</button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
