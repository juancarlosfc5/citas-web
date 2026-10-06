import type { AppointmentStatus } from '../../types';

// Solo traduce la etiqueta visible; el estado sigue siendo el valor que entrega citas-api.
const STATUS_META: Record<AppointmentStatus, { label: string; cls: string }> = {
  APPROVED: { label: 'Confirmada', cls: 'bg-success-soft text-success' },
  REQUESTED: { label: 'En revisión', cls: 'bg-warning-soft text-warning' },
  REJECTED: { label: 'Rechazada', cls: 'bg-danger-soft text-danger' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-sunken text-muted' },
  COMPLETED: { label: 'Atendida', cls: 'bg-info-soft text-info' },
  NO_SHOW: { label: 'No asistió', cls: 'bg-sunken text-ink-soft' },
};

export function statusLabel(status: string): string {
  return STATUS_META[status as AppointmentStatus]?.label ?? status;
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as AppointmentStatus] ?? { label: status, cls: 'bg-sunken text-ink-soft' };
  return (
    <span title={status} className={`inline-flex items-center gap-1.5 shrink-0 h-6 pl-2 pr-2.5 rounded-md text-[11px] font-medium ${meta.cls}`}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
