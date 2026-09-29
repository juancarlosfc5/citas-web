import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookAppointmentModal } from './BookAppointmentModal';
import { appointmentsApi, catalogsApi, SchedulingApiError } from '../api/schedulingApi';

vi.mock('../api/schedulingApi', async (original) => {
  const actual = await original<typeof import('../api/schedulingApi')>();
  return { ...actual, catalogsApi: { locations: vi.fn(), specialties: vi.fn(), insurancePlans: vi.fn() }, appointmentsApi: { ...actual.appointmentsApi, availability: vi.fn(), create: vi.fn() } };
});

const FUTURE = '2099-01-15';
const OTHER = '2099-01-16';
const professional = { id: '7', name: 'Dra. Sintética', slots: [{ startAt: `${FUTURE}T08:00:00`, endAt: `${FUTURE}T09:00:00` }, { startAt: `${FUTURE}T14:00:00`, endAt: `${FUTURE}T15:00:00` }] };

async function fillFilters(user: ReturnType<typeof userEvent.setup>, date = FUTURE) {
  await user.selectOptions(await screen.findByLabelText('Sede'), '1');
  await user.selectOptions(screen.getByLabelText('Especialidad'), '3');
  const input = screen.getByLabelText('Fecha');
  await user.clear(input); await user.type(input, date);
}

describe('BookAppointmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogsApi.locations).mockResolvedValue([{ id: '1', name: 'Sede Norte' }]);
    vi.mocked(catalogsApi.specialties).mockResolvedValue([{ id: '3', name: 'Cardiología', durationMinutes: 60 }]);
    vi.mocked(appointmentsApi.availability).mockResolvedValue([professional]);
  });

  it('permite elegir fecha futura antes del profesional y envía fecha y hora locales', async () => {
    const user = userEvent.setup(); const onBooked = vi.fn();
    vi.mocked(appointmentsApi.create).mockResolvedValue({ id: '9', status: 'REQUESTED', startAt: `${FUTURE}T14:00:00`, professionalName: 'Dra. Sintética', specialtyName: 'Cardiología', locationName: 'Sede Norte', durationMinutes: 60 });
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={onBooked} />);
    await fillFilters(user);
    await waitFor(() => expect(appointmentsApi.availability).toHaveBeenLastCalledWith({ locationId: '1', specialtyId: '3', date: FUTURE }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(await screen.findByRole('button', { name: /Dra. Sintética/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('button', { name: /14:00/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('button', { name: /Confirmar/ }));
    await waitFor(() => expect(appointmentsApi.create).toHaveBeenCalledWith(expect.objectContaining({ professionalId: '7', locationId: '1', specialtyId: '3', date: FUTURE, startTime: '14:00' }), expect.anything()));
    expect(await screen.findByText('Solicitud enviada a revisión administrativa')).toBeInTheDocument();
    expect(onBooked).toHaveBeenCalled();
  });

  it('muestra la aprobación inmediata de una cita general', async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentsApi.create).mockResolvedValue({ id: '10', status: 'APPROVED', startAt: `${FUTURE}T08:00:00`, professionalName: 'Dra. Sintética', specialtyName: 'Medicina General', locationName: 'Sede Norte', durationMinutes: 30 });
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await fillFilters(user);
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(await screen.findByRole('button', { name: /Dra. Sintética/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('button', { name: /08:00/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('button', { name: /Confirmar/ }));
    expect(await screen.findByText('Cita aprobada')).toBeInTheDocument();
  });

  it('reconsulta al cambiar la fecha y descarta el profesional elegido', async () => {
    const user = userEvent.setup();
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await fillFilters(user);
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(await screen.findByRole('button', { name: /Dra. Sintética/ }));
    await user.click(screen.getByRole('button', { name: /Anterior/ }));
    const input = screen.getByLabelText('Fecha'); await user.clear(input); await user.type(input, OTHER);
    await waitFor(() => expect(appointmentsApi.availability).toHaveBeenLastCalledWith({ locationId: '1', specialtyId: '3', date: OTHER }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled();
  });

  it('ante 409 vuelve a las franjas, refresca disponibilidad y lo explica', async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentsApi.create).mockRejectedValue(new SchedulingApiError(409, 'Franja ya reservada'));
    render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await fillFilters(user);
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(await screen.findByRole('button', { name: /Dra. Sintética/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('button', { name: /08:00/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    const calls = vi.mocked(appointmentsApi.availability).mock.calls.length;
    await user.click(screen.getByRole('button', { name: /Confirmar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('dejó de estar disponible');
    expect(screen.getByText(/Paso 3 de 4/)).toBeInTheDocument();
    expect(vi.mocked(appointmentsApi.availability).mock.calls.length).toBeGreaterThan(calls);
  });
});

describe('BookAppointmentModal — reapertura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogsApi.locations).mockResolvedValue([{ id: '1', name: 'Sede Norte' }]);
    vi.mocked(catalogsApi.specialties).mockResolvedValue([{ id: '3', name: 'Cardiología', durationMinutes: 60 }]);
    vi.mocked(appointmentsApi.availability).mockResolvedValue([professional]);
  });

  it('reconsulta la disponibilidad al volver a abrir con los mismos filtros', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await fillFilters(user);
    await waitFor(() => expect(appointmentsApi.availability).toHaveBeenLastCalledWith({ locationId: '1', specialtyId: '3', date: FUTURE }));
    const calls = vi.mocked(appointmentsApi.availability).mock.calls.length;
    rerender(<BookAppointmentModal isOpen={false} onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    rerender(<BookAppointmentModal isOpen onClose={vi.fn()} onAppointmentBooked={vi.fn()} />);
    await waitFor(() => expect(vi.mocked(appointmentsApi.availability).mock.calls.length).toBeGreaterThan(calls));
  });
});
