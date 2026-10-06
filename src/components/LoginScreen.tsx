import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { User } from '../types';
import { authErrorMessage, login } from '../auth/authApi';
import { AuthHeading, AuthLayout, PasswordToggle } from './auth/AuthLayout';
import { TextField } from './ui/Field';
import { Button } from './ui/Button';
import { Alert } from './ui/Surface';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onNavigateRegister: () => void;
  onNavigateRecovery?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateRecovery,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const user = await login(email, password, rememberMe);
      onLoginSuccess(user);
    } catch (error) {
      setErrorMessage(authErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <p className="text-sm text-ink-soft">
      ¿No tienes una cuenta?{' '}
      <button type="button" id="register-redirect-btn" onClick={onNavigateRegister} className="font-medium text-accent underline-offset-4 hover:underline cursor-pointer">
        Regístrate aquí
      </button>
    </p>
  );

  return (
    <AuthLayout
      id="login-main-container"
      caption="Acceso seguro"
      headline={<>Tus citas médicas,<br /><em className="text-accent-glow">en orden</em> y a tiempo.</>}
      lede="Agenda, consulta y gestiona tu atención en un solo lugar, con la disponibilidad real de cada sede."
      footer={footer}
    >
      <AuthHeading title="Iniciar sesión" description="Ingresa tus credenciales para administrar tus citas médicas programadas." />

      <form className="space-y-5" onSubmit={handleSubmit} id="login-form">
        {errorMessage && <Alert>{errorMessage}</Alert>}

        <TextField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" required placeholder="usuario@ejemplo.com" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} />

        <TextField
          id="password"
          name="password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          placeholder="Introduce tu contraseña"
          icon={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-ink-soft min-h-11">
            <input className="w-4 h-4 rounded accent-accent" id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Recordar sesión
          </label>
          <button type="button" onClick={onNavigateRecovery} className="min-h-11 text-accent font-medium underline-offset-4 hover:underline cursor-pointer">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button id="submit-login-button" type="submit" size="lg" fullWidth isLoading={isLoading} loadingLabel="Accediendo…">
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
};
