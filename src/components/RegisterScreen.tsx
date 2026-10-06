import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { authErrorMessage, register } from '../auth/authApi';
import { catalogsApi } from '../api/schedulingApi';
import type { CatalogItem } from '../types';
import { AuthHeading, AuthLayout, PasswordToggle } from './auth/AuthLayout';
import { SelectField, TextField } from './ui/Field';
import { Button } from './ui/Button';
import { Alert } from './ui/Surface';

interface RegisterScreenProps {
  onRegisterSuccess: (user: User) => void;
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [insurancePlanId, setInsurancePlanId] = useState('');
  const [insurancePlans, setInsurancePlans] = useState<CatalogItem[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    catalogsApi.insurancePlans().then(setInsurancePlans).catch(() => setInsurancePlans([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !documentType || !documentNumber || !email || !phone || !password) {
      setErrorMessage('Por favor completa los campos obligatorios.');
      return;
    }
    if (!acceptTerms) {
      setErrorMessage('Debes aceptar el tratamiento confidencial de datos de salud.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await register({
        firstName,
        lastName,
        documentType,
        documentNumber,
        email,
        phone,
        password,
        ...(insurancePlanId ? { insurancePlanId } : {}),
      });
      onRegisterSuccess(user);
    } catch (error) {
      setErrorMessage(authErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <p className="text-sm text-ink-soft">
      ¿Ya estás registrado?{' '}
      <button type="button" id="login-redirect-btn" onClick={onNavigateLogin} className="font-medium text-accent underline-offset-4 hover:underline cursor-pointer">
        Inicia sesión aquí
      </button>
    </p>
  );

  return (
    <AuthLayout
      id="register-main-container"
      caption="Nuevo paciente"
      wide
      headline={<>Empieza a cuidar<br />tu agenda <em className="text-accent-glow">de salud</em>.</>}
      lede="Crea tu cuenta de paciente y agenda con profesionales según la disponibilidad publicada en cada sede."
      points={['Agendamiento guiado en tres pasos', 'Estado de cada cita siempre visible', 'Reprogramación y cancelación desde tu panel']}
      footer={footer}
    >
      <button type="button" id="back-to-login-btn" onClick={onNavigateLogin} className="mb-6 -ml-1 inline-flex items-center gap-1.5 min-h-9 px-1 text-sm text-ink-soft hover:text-ink cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        Volver al login
      </button>

      <AuthHeading title="Registrarse como paciente" description="Completa tus datos para agendar citas y gestionar tu salud de manera centralizada." />

      <form className="space-y-4" onSubmit={handleSubmit} id="register-form">
        {errorMessage && <Alert>{errorMessage}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="reg-first-name" label="Nombres" required autoComplete="given-name" placeholder="Ej. Carmen" icon={<UserIcon />} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextField id="reg-last-name" label="Apellidos" required autoComplete="family-name" placeholder="Ej. Rodríguez Silva" icon={<UserIcon />} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <TextField id="reg-email" label="Correo electrónico" type="email" required autoComplete="email" placeholder="carmen@ejemplo.com" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField id="reg-phone" label="Teléfono móvil" type="tel" required autoComplete="tel" inputMode="tel" placeholder="300 000 0000" icon={<Phone />} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <SelectField id="reg-document-type" label="Tipo de documento" required icon={<FileText />} value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="PA">Pasaporte</option>
            <option value="TI">Tarjeta de identidad</option>
          </SelectField>
          <TextField id="reg-document-number" label="Número de documento" required inputMode="numeric" placeholder="Ej. 1098765432" icon={<FileText />} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        </div>

        <TextField
          id="reg-password"
          label="Contraseña"
          hint="Mínimo 8 caracteres."
          required
          minLength={8}
          autoComplete="new-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Crea una contraseña segura"
          icon={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
        />

        <SelectField id="reg-insurance-plan" label="Plan de afiliación (opcional)" value={insurancePlanId} onChange={(event) => setInsurancePlanId(event.target.value)}>
          <option value="">Sin afiliación por ahora</option>
          {insurancePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
        </SelectField>

        <label className="flex items-start gap-3 p-3.5 rounded-field bg-canvas border border-line cursor-pointer select-none text-[13px] leading-snug text-ink-soft">
          <input className="w-4 h-4 mt-0.5 rounded accent-accent shrink-0" id="accept-terms" name="accept-terms" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
          <span>He leído y acepto el consentimiento de privacidad y resguardo seguro de datos médicos conforme a la legislación vigente.</span>
        </label>

        <Button id="submit-register-btn" type="submit" size="lg" fullWidth isLoading={isLoading} loadingLabel="Creando tu cuenta…">
          Registrarme y acceder
        </Button>
        <p className="text-xs text-muted text-center">Todos los campos son obligatorios salvo el plan de afiliación.</p>
      </form>
    </AuthLayout>
  );
};
