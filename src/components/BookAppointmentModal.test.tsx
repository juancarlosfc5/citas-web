import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookAppointmentModal } from './BookAppointmentModal';
import { appointmentsApi, catalogsApi, SchedulingApiError } from '../api/schedulingApi';

vi.mock('../api/bogotaTime', async (original) => ({ ...(await original<typeof import('../api/bogotaTime')>()), bogotaToday: () => '2099-01-10' }));
vi.mock('../api/schedulingApi', async (original) => {
  const actual = await original<typeof import('../api/schedulingApi')>();
  return { ...actual, catalogsApi: { locations: vi.fn(), specialties: vi.fn(), insurancePlans: vi.fn() }, appointmentsApi: { ...actual.appointmentsApi, availableDays: vi.fn(), availability: vi.fn(), create: vi.fn() } };
});

const DAY = '2099-01-15';
const professional = { id: '7', name: 'Dra. Sintética', slots: [{ startAt: `${DAY}T08:00:00`, endAt: `${DAY}T09:00:00` }, { startAt: `${DAY}T14:00:00`, endAt: `${DAY}T15:00:00` }] };
const booked = (status: 'APPROVED' | 'REQUESTED', time: string) => ({ id: '9', status, startAt: `${DAY}T${time}:00`, professionalName: 'Dra. Sintética', specialtyName: 'Cardiología', locationName: 'Sede Norte', durationMinutes: 60 as const });

async function pickFilters(user: ReturnType<typeof userEvent.setup>, specialty = /Cardiología/) {
  await user.click(await screen.findByRole('radio', { name: specialty }));
  await user.selectOptions(screen.getByLabelText('Sede'), '1');
  await user.click(screen.getByRole('button', { name: /Continuar/ }));
}
async function pickDayAndTime(user: ReturnType<typeof userEvent.setup>, time: string) {
  await user.click(await screen.findByRole('button', { name: new RegExp(`^${DAY}: 2 horarios`) }));
  await user.click(await screen.findByRole('button', { name: new RegExp(time) }));
  await user.click(screen.getByRole('button', { name: /Continuar/ }));
}

describe('BookAppointmentModal con calendario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogsApi.locations).mockResolvedValue([{ id: '1', name: 'Sede Norte' }]);
    vi.mocked(catalogsApi.specialties).mockResolvedValue([{ id: '3', name: 'Cardiología', durationMinutes: 60 }, { id: '1', name: 'Medicina General', durationMinutes: 30 }]);
    vi.mocked(appointmentsApi.availableDays).mockResolvedValue([{ date: DAY, slots: 2 }]);
    vi.mocked(appointmentsApi.availability).mockResolvedValue([professional]);
  });

  it('consulta días del mes desde hoy y solo habilita los días con horarios', async () => {
    const user = userEvent.setup();
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await pickFilters(user);
    await waitFor(() => expect(appointmentsApi.availableDays).toHaveBeenLastCalledWith({ locationId: '1', specialtyId: '3', from: '2099-01-10', to: '2099-01-31' }));
    expect(await screen.findByRole('button', { name: `${DAY}: 2 horarios disponibles` })).toBeEnabled();
    expect(screen.getByRole('button', { name: '2099-01-16: sin disponibilidad' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '2099-01-05: sin disponibilidad' })).toBeDisabled();
  });

  it('al elegir un día muestra sus horas y envía fecha y hora locales; resultado REQUESTED', async () => {
    const user = userEvent.setup(); const onBooked = vi.fn();
    vi.mocked(appointmentsApi.create).mockResolvedValue(booked('REQUESTED', '14:00'));
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={onBooked} />);
    await pickFilters(user);
    await pickDayAndTime(user, '14:00');
    expect(appointmentsApi.availability).toHaveBeenLastCalledWith({ locationId: '1', specialtyId: '3', date: DAY });
    await user.click(screen.getByRole('button', { name: /Confirmar/ }));
    await waitFor(() => expect(appointmentsApi.create).toHaveBeenCalledWith(expect.objectContaining({ professionalId: '7', locationId: '1', specialtyId: '3', date: DAY, startTime: '14:00' }), expect.anything()));
    expect(await screen.findByText('Solicitud enviada a revisión administrativa')).toBeInTheDocument();
    expect(onBooked).toHaveBeenCalled();
  });

  it('muestra la aprobación inmediata de una cita general', async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentsApi.create).mockResolvedValue(booked('APPROVED', '08:00'));
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await pickFilters(user, /Medicina General/);
    await pickDayAndTime(user, '08:00');
    await user.click(screen.getByRole('button', { name: /Confirmar/ }));
    expect(await screen.findByText('Cita aprobada')).toBeInTheDocument();
  });

  it('cambiar la especialidad reinicia día y hora y reconsulta', async () => {
    const user = userEvent.setup();
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await pickFilters(user);
    await user.click(await screen.findByRole('button', { name: new RegExp(`^${DAY}: 2 horarios`) }));
    await user.click(await screen.findByRole('button', { name: /08:00/ }));
    await user.click(screen.getByRole('button', { name: /Anterior/ }));
    await user.click(screen.getByRole('radio', { name: /Medicina General/ }));
    await waitFor(() => expect(appointmentsApi.availableDays).toHaveBeenLastCalledWith(expect.objectContaining({ specialtyId: '1' })));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(await screen.findByText('Selecciona un día para ver sus horarios.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled();
  });

  it('ante 409 vuelve al calendario, refresca horarios y lo explica', async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentsApi.create).mockRejectedValue(new SchedulingApiError(409, 'Franja ya reservada'));
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await pickFilters(user);
    await pickDayAndTime(user, '08:00');
    const calls = vi.mocked(appointmentsApi.availability).mock.calls.length;
    await user.click(screen.getByRole('button', { name: /Confirmar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('dejó de estar disponible');
    expect(screen.getByText(/Paso 2 de 3/)).toBeInTheDocument();
    expect(vi.mocked(appointmentsApi.availability).mock.calls.length).toBeGreaterThan(calls);
  });

  it('reconsulta los días al volver a abrir con los mismos filtros', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await pickFilters(user);
    await waitFor(() => expect(appointmentsApi.availableDays).toHaveBeenCalled());
    const calls = vi.mocked(appointmentsApi.availableDays).mock.calls.length;
    rerender(<BookAppointmentModal isOpen={false} onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    rerender(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await waitFor(() => expect(vi.mocked(appointmentsApi.availableDays).mock.calls.length).toBeGreaterThan(calls));
  });
});
