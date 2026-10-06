import { CalendarPlus, LogOut, ShieldCheck } from 'lucide-react';
import type { User } from '../types';
import { Brand } from './ui/Brand';
import { Button } from './ui/Button';
import { UserHome } from './dashboard/UserHome';
import { AdminHome } from './dashboard/AdminHome';
import { ProfessionalHome } from './dashboard/ProfessionalHome';

interface Props { user: User; bookingsVersion?: number; onOpenBooking: () => void; onLogout: () => void; }

const ROLE_LABEL = { USER: 'Paciente', ADMIN: 'Administración', PROFESSIONAL: 'Profesional' } as const;

export function DashboardScreen({ user, bookingsVersion = 0, onOpenBooking, onLogout }: Props) {
  const role = user.roles?.includes('ADMIN') ? 'ADMIN' : user.roles?.includes('PROFESSIONAL') ? 'PROFESSIONAL' : 'USER';
  return (
    <div className="w-full max-w-[87.5rem] mx-auto pb-24 sm:pb-12">
      <header className="sticky top-2 sm:top-4 z-40 mb-6 sm:mb-8 flex items-center justify-between gap-3 pl-3 pr-2 sm:pl-5 sm:pr-3 py-2 rounded-2xl bg-surface/85 backdrop-blur-md border border-line/70 shadow-card">
        <Brand caption={ROLE_LABEL[role]} compact />
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="hidden md:block text-sm text-ink-soft max-w-[18ch] truncate">{user.name}</span>
          {role === 'USER' && (
            <span className="hidden sm:block"><Button onClick={onOpenBooking} icon={<CalendarPlus className="w-4 h-4" />}>Agendar cita</Button></span>
          )}
          <button type="button" onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión" className="grid place-items-center w-11 h-11 rounded-xl text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      <main>
        {role === 'USER' ? <UserHome user={user} open={onOpenBooking} version={bookingsVersion} /> : role === 'ADMIN' ? <AdminHome /> : <ProfessionalHome />}
      </main>

      <footer className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted">
        <ShieldCheck className="w-3.5 h-3.5" />Datos sintéticos de laboratorio
      </footer>

      {role === 'USER' && (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 px-4 pt-3 safe-bottom bg-gradient-to-t from-canvas via-canvas/95 to-canvas/0">
          <Button onClick={onOpenBooking} size="lg" fullWidth icon={<CalendarPlus className="w-4 h-4" />}>Agendar cita</Button>
        </div>
      )}
    </div>
  );
}
