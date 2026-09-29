import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApi, appointmentsApi, availabilityApi, catalogsApi } from './schedulingApi';
import { formatLocal, localDate, localTime } from './bogotaTime';

vi.mock('../auth/authApi', () => ({ getAccessToken: () => 'test-token' }));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('cierre de agendamiento: cliente REST', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('mapea el bloque real de la API (date/start/end) a fecha y horas locales', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([{ id: 5, locationId: 2, date: '2026-10-01', start: '08:00:00', end: '10:00:00' }]));
    const [block] = await availabilityApi.listMine();
    expect(block).toMatchObject({ id: '5', locationId: '2', startAt: '2026-10-01T08:00:00', endAt: '2026-10-01T10:00:00' });
    expect(localTime(block.startAt)).toBe('08:00');
    expect(localTime(block.endAt)).toBe('10:00');
  });

  it('publica un bloque enviando fecha y horas HH:mm sin conversión de zona', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ id: 6, locationId: 2, date: '2026-10-01', start: '14:00:00', end: '15:00:00' }, 201));
    await availabilityApi.create({ locationId: '2', startAt: '2026-10-01T14:00', endAt: '2026-10-01T15:00' });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ locationId: '2', date: '2026-10-01', startTime: '14:00', endTime: '15:00' });
  });

  it('edita un bloque con PATCH enviando fecha y horas HH:mm', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ id: 38, locationId: 2, date: '2026-10-07', start: '10:00:00', end: '12:00:00' }));
    const block = await availabilityApi.update('38', { locationId: '2', startAt: '2026-10-07T10:00', endAt: '2026-10-07T12:00' });
    expect(fetchMock.mock.calls[0][0]).toContain('/professional/availability-blocks/38');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ locationId: '2', date: '2026-10-07', startTime: '10:00', endTime: '12:00' });
    expect(block.endAt).toBe('2026-10-07T12:00:00');
  });

  it('obtiene solicitudes especializadas del endpoint dedicado y decide con el id de la cita', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json([{ id: 41, startAt: '2026-10-02T09:00:00', endAt: '2026-10-02T10:00:00', patientFirstName: 'Paciente', patientLastName: 'Sintético', specialty: 'Cardiología', location: 'Sede Norte' }]))
      .mockResolvedValueOnce(json({ id: 41, status: 'REJECTED', startAt: '2026-10-02T09:00:00' }));
    const [pending] = await appointmentsApi.pendingSpecialized();
    expect(fetchMock.mock.calls[0][0]).toContain('/admin/appointments/pending-specialized');
    expect(pending).toMatchObject({ id: '41', patientName: 'Paciente Sintético', specialtyName: 'Cardiología' });
    const decided = await adminApi.decide(pending.id, 'REJECT', 'Sin agenda');
    expect(fetchMock.mock.calls[1][0]).toContain('/admin/appointments/41/decision');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ decision: 'REJECT', reason: 'Sin agenda' });
    expect(decided.status).toBe('REJECTED');
  });

  it('normaliza identificadores numéricos de catálogos a texto', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([{ id: 3, name: 'Cardiología', durationMinutes: 60 }]));
    expect((await catalogsApi.specialties())[0].id).toBe('3');
  });
});

describe('hora local America/Bogota', () => {
  it('extrae fecha y hora sin depender de la zona del navegador', () => {
    expect(localDate('2026-10-01T23:30:00')).toBe('2026-10-01');
    expect(localTime('2026-10-01T23:30:00')).toBe('23:30');
    expect(formatLocal('2026-10-01T07:00')).toBe('2026-10-01 · 07:00');
    expect(() => localTime('mañana')).toThrow();
  });
});
