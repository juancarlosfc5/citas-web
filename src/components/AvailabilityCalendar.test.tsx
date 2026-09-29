import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AvailabilityCalendar, monthRange, shiftMonth } from './AvailabilityCalendar';

describe('AvailabilityCalendar', () => {
  it('calcula meses y rangos sin depender de la zona horaria', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('empieza la semana en lunes, bloquea el mes anterior a hoy y notifica selección', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn(); const onMonth = vi.fn();
    render(<AvailabilityCalendar month="2026-10" minDate="2026-10-05" availableDays={{ '2026-10-06': 3, '2026-10-01': 4 }} selectedDate="" isLoading={false} onMonthChange={onMonth} onSelectDate={onSelect} />);
    expect(screen.getByLabelText('Mes anterior')).toBeDisabled();
    expect(screen.getByRole('button', { name: '2026-10-01: sin disponibilidad' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '2026-10-06: 3 horarios disponibles' }));
    expect(onSelect).toHaveBeenCalledWith('2026-10-06');
    await user.click(screen.getByLabelText('Mes siguiente'));
    expect(onMonth).toHaveBeenCalledWith('2026-11');
    const cells = screen.getAllByRole('button').filter((b) => /^2026-10-/.test(b.getAttribute('aria-label') ?? ''));
    expect(cells).toHaveLength(31);
    // 1-oct-2026 es jueves: 3 celdas vacías antes (lunes a miércoles).
    expect(screen.getByLabelText('Calendario de disponibilidad').querySelectorAll('.grid > span:not([class])')).toHaveLength(3);
  });
});
