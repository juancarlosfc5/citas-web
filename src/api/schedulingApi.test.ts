import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appointmentsApi, SchedulingApiError, schedulingErrorMessage } from './schedulingApi';

vi.mock('../auth/authApi', () => ({ getAccessToken: () => 'test-token' }));

describe('cliente de agenda S4', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('consulta las citas propias con autorización', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([{ id: 8, status: 'APPROVED', startAt: '2026-10-01T08:00:00', professionalName: 'Dra. Ana', specialtyName: 'General', locationName: 'Sede Norte', durationMinutes: 30 }]), { status: 200 }));
    const result = await appointmentsApi.mine({ from: '2026-10-01' });
    expect(result[0]).toMatchObject({ id: '8', status: 'APPROVED', professionalName: 'Dra. Ana' });
    expect(fetchMock.mock.calls[0][0]).toContain('/appointments?from=2026-10-01');
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
  });

  it('envía cancelación y convierte conflicto en mensaje accionable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ detail: 'ocupado' }), { status: 409 }));
    await expect(appointmentsApi.cancel('9')).rejects.toMatchObject({ status: 409 });
    expect(schedulingErrorMessage(new SchedulingApiError(409, 'ocupado'))).toContain('conflicto');
  });

  it('crea una solicitud de reprogramación sin mantener estado simulado', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: '31', appointmentId: '9', status: 'PENDING', newStartAt: '2026-10-02T10:00:00' }), { status: 201 }));
    const request = await appointmentsApi.reschedule('9', { date: '2026-10-02', startTime: '10:00', reason: 'Viaje' });
    expect(request.status).toBe('PENDING');
    expect(fetchMock.mock.calls[0][0]).toContain('/appointments/9/reschedule-requests');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
  });

  it('muestra un error de acceso denegado para la vista por rol', () => {
    expect(schedulingErrorMessage(new SchedulingApiError(403, 'forbidden'))).toBe('No tienes permiso para realizar esta acción.');
  });
});
