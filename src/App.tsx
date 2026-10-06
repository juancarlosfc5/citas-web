import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';
import type { Appointment, ScreenType, User } from './types';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { BookAppointmentModal } from './components/BookAppointmentModal';
import { PasswordRecoveryScreen, PasswordResetScreen } from './components/PasswordRecoveryScreen';
import { logout, restoreSession } from './auth/authApi';
import { formatLocal } from './api/bogotaTime';
import { BrandMark } from './components/ui/Brand';
import { Button, Spinner } from './components/ui/Button';
import { StatusBadge } from './components/ui/StatusBadge';

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('login'); const [user, setUser] = useState<User | null>(null); const [restoring, setRestoring] = useState(true); const [bookingOpen, setBookingOpen] = useState(false); const [confirmation, setConfirmation] = useState<Appointment | null>(null); const [bookingsVersion, setBookingsVersion] = useState(0); const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { let active = true; restoreSession().then((account) => { if (!active) return; if (account) { setUser(account); setScreen('dashboard'); } setRestoring(false); }); return () => { active = false; }; }, []);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 3500); };

  if (restoring) {
    return (
      <main className="min-h-dvh grid place-items-center px-4">
        <div className="flex flex-col items-center gap-4 text-sm text-ink-soft animate-fade">
          <BrandMark className="w-12 h-12" />
          <span className="inline-flex items-center gap-2"><Spinner className="text-accent" />Verificando sesión segura…</span>
        </div>
      </main>
    );
  }

  const isDashboard = screen === 'dashboard' && user;

  return (
    <div className={`min-h-dvh flex flex-col items-center px-4 sm:px-6 lg:px-8 ${isDashboard ? 'justify-start py-4 sm:py-6' : 'justify-center py-6 sm:py-10'}`}>
      {toast && (
        <div role="status" className="fixed z-[60] top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-ink text-white text-sm shadow-lift animate-rise">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-accent-glow" />{toast}
        </div>
      )}

      {screen === 'login' && <LoginScreen onLoginSuccess={(account) => { setUser(account); setScreen('dashboard'); notify(`Bienvenido/a, ${account.name}.`); }} onNavigateRegister={() => setScreen('register')} onNavigateRecovery={() => setScreen('recovery')} />}
      {screen === 'register' && <RegisterScreen onRegisterSuccess={(account) => { setUser(account); setScreen('dashboard'); notify('Cuenta creada exitosamente.'); }} onNavigateLogin={() => setScreen('login')} />}
      {screen === 'recovery' && <PasswordRecoveryScreen onBack={() => setScreen('login')} onReset={() => setScreen('reset')} />}
      {screen === 'reset' && <PasswordResetScreen onBack={() => setScreen('login')} />}
      {screen === 'dashboard' && user && <DashboardScreen user={user} bookingsVersion={bookingsVersion} onOpenBooking={() => setBookingOpen(true)} onLogout={async () => { try { await logout(); setUser(null); setScreen('login'); notify('Has cerrado sesión correctamente.'); } catch { notify('No fue posible cerrar la sesión.'); } }} />}

      <BookAppointmentModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} onAppointmentBooked={(appointment) => { setConfirmation(appointment); setBookingsVersion((v) => v + 1); notify(appointment.status === 'APPROVED' ? 'Tu cita fue aprobada.' : 'Tu solicitud quedó pendiente de aprobación.'); }} />

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-night/55 backdrop-blur-[2px] animate-fade">
          <section role="dialog" aria-modal="true" aria-labelledby="confirmation-title" className="w-full sm:max-w-md bg-surface rounded-t-shell sm:rounded-shell p-6 sm:p-8 shadow-lift safe-bottom animate-sheet">
            <span className={`grid place-items-center w-12 h-12 rounded-2xl mb-5 ${confirmation.status === 'APPROVED' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
              {confirmation.status === 'APPROVED' ? <CheckCircle2 className="w-6 h-6" /> : <Clock3 className="w-6 h-6" />}
            </span>
            <h2 id="confirmation-title" className="font-display text-[2rem] leading-none">{confirmation.status === 'APPROVED' ? 'Cita aprobada' : 'Solicitud registrada'}</h2>
            <p className="mt-3 text-sm text-ink-soft">{confirmation.specialtyName} con {confirmation.professionalName}.</p>
            <dl className="mt-5 p-4 rounded-card bg-canvas border border-line text-sm space-y-2">
              <div className="flex justify-between gap-4"><dt className="text-muted">Fecha</dt><dd className="tabular text-right">{formatLocal(confirmation.startAt)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Sede</dt><dd className="text-right">{confirmation.locationName}</dd></div>
              <div className="flex justify-between gap-4 items-center"><dt className="text-muted">Estado</dt><dd><StatusBadge status={confirmation.status} /></dd></div>
            </dl>
            <Button size="lg" fullWidth className="mt-6" autoFocus onClick={() => setConfirmation(null)}>Entendido</Button>
          </section>
        </div>
      )}
    </div>
  );
}
