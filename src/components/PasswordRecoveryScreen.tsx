import { useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail } from 'lucide-react';
import { authErrorMessage, requestPasswordRecovery, resetPassword } from '../auth/authApi';
import { Brand } from './ui/Brand';
import { Button } from './ui/Button';
import { TextField } from './ui/Field';
import { Alert } from './ui/Surface';

function Shell({ title, description, onBack, children }: { title: string; description: string; onBack: () => void; children: ReactNode }) {
  return (
    <main className="w-full max-w-[460px] mx-auto animate-rise">
      <div className="mb-6 flex justify-center"><Brand caption="Recuperación de acceso" /></div>
      <div className="bg-surface rounded-shell border border-line/70 shadow-lift p-6 sm:p-9">
        <button type="button" onClick={onBack} className="-ml-1 mb-6 inline-flex items-center gap-1.5 min-h-9 px-1 text-sm text-ink-soft hover:text-ink cursor-pointer">
          <ArrowLeft className="w-4 h-4" />Volver al acceso
        </button>
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-accent-soft text-accent mb-5"><KeyRound className="w-5 h-5" /></span>
        <h1 className="font-display text-[2.25rem] leading-none tracking-[-0.015em]">{title}</h1>
        <p className="mt-3 mb-7 text-sm text-ink-soft">{description}</p>
        {children}
      </div>
    </main>
  );
}

export function PasswordRecoveryScreen({ onBack, onReset }: { onBack: () => void; onReset: () => void }) {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); setError(''); try { await requestPasswordRecovery(email); setMessage('Si existe una cuenta asociada, recibirás instrucciones para restablecer la contraseña.'); } catch (cause) { setError(authErrorMessage(cause)); } finally { setLoading(false); } };
  return (
    <Shell title="Recuperar contraseña" description="Ingresa tu correo para solicitar el restablecimiento." onBack={onBack}>
      {message ? (
        <div className="space-y-4">
          <Alert tone="success"><CheckCircle2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />{message}</Alert>
          <Button size="lg" fullWidth onClick={onReset}>Tengo un token temporal</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error && <Alert>{error}</Alert>}
          <TextField id="recovery-email" label="Correo electrónico" required type="email" autoComplete="email" placeholder="usuario@ejemplo.com" icon={<Mail />} value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button type="submit" size="lg" fullWidth isLoading={loading} loadingLabel="Enviando…">Solicitar restablecimiento</Button>
        </form>
      )}
    </Shell>
  );
}

export function PasswordResetScreen({ onBack }: { onBack: () => void }) {
  const [token, setToken] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (password !== confirmation) { setError('Las contraseñas deben coincidir.'); return; } setLoading(true); setError(''); try { await resetPassword(token, password); setMessage('Contraseña actualizada. Ya puedes iniciar sesión.'); } catch (cause) { setError(authErrorMessage(cause)); } finally { setLoading(false); } };
  return (
    <Shell title="Nueva contraseña" description="Usa el token temporal recibido para crear una contraseña segura." onBack={onBack}>
      {message ? (
        <div className="space-y-4">
          <Alert tone="success">{message}</Alert>
          <Button size="lg" fullWidth onClick={onBack}>Ir a iniciar sesión</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <TextField id="reset-token" label="Token temporal" required autoComplete="one-time-code" placeholder="Pega el token recibido" icon={<KeyRound />} value={token} onChange={(event) => setToken(event.target.value)} />
          <TextField id="reset-password" label="Nueva contraseña" hint="Mínimo 8 caracteres." required minLength={8} type="password" autoComplete="new-password" icon={<Lock />} value={password} onChange={(event) => setPassword(event.target.value)} />
          <TextField id="reset-confirmation" label="Confirmar contraseña" required minLength={8} type="password" autoComplete="new-password" icon={<Lock />} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          <Button type="submit" size="lg" fullWidth isLoading={loading} loadingLabel="Actualizando…">Actualizar contraseña</Button>
        </form>
      )}
    </Shell>
  );
}
