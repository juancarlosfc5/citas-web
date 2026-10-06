import { useEffect, useState, type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { adminApi, appointmentsApi, schedulingErrorMessage } from '../../api/schedulingApi';
import { formatLocal } from '../../api/bogotaTime';
import type { Appointment, InsurancePlan, InsuranceProvider, Specialty } from '../../types';
import { Button } from '../ui/Button';
import { fieldClass } from '../ui/Field';
import { Alert, Card, EmptyState, SectionHeader } from '../ui/Surface';

const fmt = formatLocal;
const linkBtn = 'min-h-9 px-2 rounded-lg text-[13px] font-medium text-accent hover:bg-accent-soft transition-colors cursor-pointer';

function Row({ children, actions, inactive = false }: { children: ReactNode; actions: ReactNode; inactive?: boolean }) {
  return (
    <li className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-3.5 pr-1.5 py-1.5 rounded-field border border-line text-sm ${inactive ? 'bg-sunken/60 text-muted' : 'bg-canvas/40 text-ink'}`}>
      <span className="min-w-0 py-1">{children}</span>
      <span className="flex items-center gap-0.5">{actions}</span>
    </li>
  );
}

export function AdminHome() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]); const [eps, setEps] = useState<InsuranceProvider[]>([]); const [plans, setPlans] = useState<InsurancePlan[]>([]); const [pending, setPending] = useState<Appointment[]>([]); const [error, setError] = useState(''); const [form, setForm] = useState({ code: '', name: '', durationMinutes: 30 as 30 | 60, general: false }); const [epsForm, setEpsForm] = useState({ code: '', name: '' }); const [planForm, setPlanForm] = useState({ epsId: '', code: '', name: '' });
  const load = () => Promise.all([adminApi.specialties(), adminApi.eps(), adminApi.plans(), appointmentsApi.pendingSpecialized()]).then(([s, e, p, inbox]) => { setSpecialties(s); setEps(e); setPlans(p); setPending(inbox); }).catch((cause) => setError(schedulingErrorMessage(cause)));
  useEffect(() => { load(); }, []);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);
  const decision = async (a: Appointment, decisionType: 'APPROVE' | 'REJECT', reason?: string) => { if (decisionType === 'REJECT' && !reason?.trim()) { setError('El motivo de rechazo es obligatorio.'); return; } setError(''); try { await adminApi.decide(a.id, decisionType, reason?.trim()); setRejecting(null); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } };
  const editEps = async (item: InsuranceProvider) => { const name = window.prompt('Nombre de la EPS', item.name); if (!name?.trim()) return; try { await adminApi.updateEps(item.id, { name }); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } };
  const editPlan = async (item: InsurancePlan) => { const name = window.prompt('Nombre del plan', item.name); if (!name?.trim()) return; try { await adminApi.updatePlan(item.id, { name }); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="animate-rise">
        <p className="text-sm text-muted">Administración</p>
        <h1 className="font-display text-[2.5rem] sm:text-[3.25rem] leading-[0.95] tracking-[-0.015em]">Panel de control</h1>
      </div>
      {error && <Alert>{error}</Alert>}

      <Card>
        <SectionHeader title="Bandeja de decisiones" description="Solicitudes especializadas pendientes de aprobación." action={<span className="inline-flex items-center h-7 px-2.5 rounded-md bg-warning-soft text-warning text-xs font-medium tabular">{pending.length} pendientes</span>} />
        <div className="mt-5">
          {pending.length ? (
            <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {pending.map((a) => (
                <li key={a.id} className="p-4 rounded-card border border-line bg-canvas/40 flex flex-col gap-3">
                  <div>
                    <p className="font-medium text-ink">{a.patientName ?? a.professionalName}</p>
                    <p className="text-[13px] text-ink-soft mt-0.5">{a.specialtyName}</p>
                    <p className="text-[13px] text-muted tabular mt-0.5">{fmt(a.startAt)}</p>
                  </div>
                  {rejecting?.id === a.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); void decision(a, 'REJECT', rejecting.reason); }} className="flex flex-col gap-2">
                      <input required aria-label="Motivo de rechazo" value={rejecting.reason} onChange={(e) => setRejecting({ id: a.id, reason: e.target.value })} placeholder="Motivo de rechazo (obligatorio)" className={fieldClass} />
                      <div className="flex gap-2">
                        <Button type="submit" variant="danger" size="sm" className="flex-1">Confirmar rechazo</Button>
                        <Button variant="ghost" size="sm" onClick={() => setRejecting(null)}>Cancelar</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-2 mt-auto">
                      <Button size="sm" className="flex-1" onClick={() => decision(a, 'APPROVE')}>Aprobar</Button>
                      <Button size="sm" variant="secondary" className="flex-1 text-danger" onClick={() => setRejecting({ id: a.id, reason: '' })}>Rechazar</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Inbox className="w-5 h-5" />} title="No hay solicitudes pendientes." />
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:gap-6 lg:grid-cols-2 items-start">
        <Card>
          <SectionHeader title="Catálogo clínico" description="Especialidades y su duración." />
          <form onSubmit={async (event) => { event.preventDefault(); try { await adminApi.createSpecialty(form); setForm({ code: '', name: '', durationMinutes: 30, general: false }); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } }} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input required aria-label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Código" className={fieldClass} />
            <input required aria-label="Especialidad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Especialidad" className={fieldClass} />
            <select aria-label="Duración" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) as 30 | 60 })} className={fieldClass}><option value={30}>30 min</option><option value={60}>60 min</option></select>
            <label className="flex items-center gap-2.5 min-h-11 px-3.5 rounded-field border border-line text-sm text-ink-soft cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-accent" checked={form.general} onChange={(e) => setForm({ ...form, general: e.target.checked })} /> General</label>
            <Button type="submit" className="sm:col-span-2">Crear especialidad</Button>
          </form>
          <ul className="mt-5 space-y-2">
            {specialties.map((s) => <Row key={s.id} inactive={s.active === false} actions={<button type="button" onClick={async () => { await adminApi.updateSpecialty(s.id, { active: s.active === false }); load(); }} className={linkBtn}>{s.active === false ? 'Activar' : 'Desactivar'}</button>}>{s.name}</Row>)}
          </ul>
        </Card>

        <Card>
          <SectionHeader title="EPS y planes" description="Aseguradoras y planes de afiliación." />
          <form onSubmit={async (event) => { event.preventDefault(); try { await adminApi.createEps(epsForm); setEpsForm({ code: '', name: '' }); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } }} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input required aria-label="Código EPS" value={epsForm.code} onChange={(e) => setEpsForm({ ...epsForm, code: e.target.value })} placeholder="Código EPS" className={fieldClass} />
            <input required aria-label="Nombre EPS" value={epsForm.name} onChange={(e) => setEpsForm({ ...epsForm, name: e.target.value })} placeholder="Nombre EPS" className={fieldClass} />
            <Button type="submit" className="sm:col-span-2">Crear EPS</Button>
          </form>
          <form onSubmit={async (event) => { event.preventDefault(); try { await adminApi.createPlan(planForm); setPlanForm({ epsId: '', code: '', name: '' }); load(); } catch (cause) { setError(schedulingErrorMessage(cause)); } }} className="mt-4 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select required aria-label="EPS del plan" value={planForm.epsId} onChange={(e) => setPlanForm({ ...planForm, epsId: e.target.value })} className={fieldClass}><option value="">EPS</option>{eps.filter((item) => item.active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <input required aria-label="Código del plan" value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} placeholder="Código" className={fieldClass} />
            <input required aria-label="Nombre del plan" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Plan" className={fieldClass} />
            <Button type="submit" variant="dark" className="sm:col-span-3">Crear plan</Button>
          </form>
          <ul className="mt-5 space-y-2">
            {eps.map((item) => <Row key={item.id} inactive={item.active === false} actions={<><button type="button" onClick={() => editEps(item)} className={linkBtn}>Editar</button><button type="button" onClick={async () => { await adminApi.updateEps(item.id, { active: item.active === false }); load(); }} className={linkBtn}>{item.active === false ? 'Activar' : 'Desactivar'}</button></>}><span className="text-muted">EPS · </span>{item.name}</Row>)}
            {plans.map((item) => <Row key={item.id} inactive={item.active === false} actions={<><button type="button" onClick={() => editPlan(item)} className={linkBtn}>Editar</button><button type="button" onClick={async () => { await adminApi.updatePlan(item.id, { active: item.active === false }); load(); }} className={linkBtn}>{item.active === false ? 'Activar' : 'Desactivar'}</button></>}><span className="text-muted">Plan · </span>{item.name}</Row>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}
