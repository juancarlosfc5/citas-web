import type { ReactNode } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Brand } from '../ui/Brand';

type Props = {
  id: string;
  caption: string;
  headline: ReactNode;
  lede: string;
  points?: string[];
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

/** Composición ilustrativa de agenda: tarjetas superpuestas, sin datos reales. */
function AgendaVignette() {
  return (
    <div aria-hidden="true" className="relative h-44 xl:h-52 mt-10 select-none">
      <div className="absolute left-0 right-10 top-8 rounded-2xl bg-white/[0.04] border border-white/10 h-32 rotate-[-3deg]" />
      <div className="absolute left-6 right-0 top-0 rounded-2xl bg-[#f4f2ed] text-ink p-4 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.6)] rotate-[1.5deg]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.16em] uppercase text-muted">Próxima cita</span>
          <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-md bg-success-soft text-success text-[10px] font-medium"><span className="w-1.5 h-1.5 rounded-full bg-current" />Confirmada</span>
        </div>
        <p className="font-display text-2xl leading-none mt-3">Medicina general</p>
        <div className="mt-4 flex items-end justify-between">
          <div className="flex gap-1.5">
            {['L', 'M', 'M', 'J', 'V'].map((d, i) => (
              <span key={i} className={`grid place-items-center w-7 h-8 rounded-md text-[10px] tabular ${i === 3 ? 'bg-accent text-white' : 'bg-sunken text-ink-soft'}`}>{d}</span>
            ))}
          </div>
          <span className="font-display text-3xl leading-none tabular">08:30</span>
        </div>
      </div>
    </div>
  );
}

export function AuthLayout({ id, caption, headline, lede, points, children, footer, wide = false }: Props) {
  return (
    <main id={id} className="w-full max-w-[73.75rem] mx-auto animate-rise">
      <div className={`grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] ${wide ? 'xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]' : ''} bg-surface rounded-shell border border-line/70 shadow-lift overflow-hidden`}>
        <aside className="relative hidden lg:flex flex-col justify-between bg-night text-white p-10 xl:p-12 overflow-hidden">
          <div className="absolute inset-0 grain opacity-60 pointer-events-none" />
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-accent/40 blur-[90px] pointer-events-none" />
          <div className="relative">
            <Brand caption={caption} tone="light" />
          </div>
          <div className="relative mt-14">
            <h1 className="font-display text-[2.75rem] xl:text-[3.25rem] leading-[0.98] tracking-[-0.015em]">{headline}</h1>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70 max-w-[38ch]">{lede}</p>
            {points && (
              <ul className="mt-7 space-y-2.5 text-sm text-white/75">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-3"><span className="w-5 h-px bg-white/40" />{point}</li>
                ))}
              </ul>
            )}
            <AgendaVignette />
          </div>
        </aside>

        <section className="flex flex-col px-5 py-7 sm:px-10 sm:py-10 xl:px-14 xl:py-12">
          <div className="lg:hidden mb-8">
            <Brand caption={caption} />
          </div>
          <div className="flex-1">{children}</div>
          <div className="mt-8 pt-6 border-t border-line space-y-3 text-center">
            {footer}
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Entorno de laboratorio con datos sintéticos.</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h2 className="font-display text-[2.25rem] sm:text-[2.5rem] leading-none tracking-[-0.015em] text-ink">{title}</h2>
      <p className="mt-3 text-sm sm:text-[15px] text-ink-soft max-w-[46ch]">{description}</p>
    </div>
  );
}

export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button type="button" aria-label="Alternar visibilidad de contraseña" onClick={onToggle} className="grid place-items-center w-10 h-10 rounded-lg text-muted hover:text-ink hover:bg-sunken transition-colors cursor-pointer">
      {visible ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
    </button>
  );
}

