import type { ReactNode } from 'react';

type CardProps = { children: ReactNode; className?: string; as?: 'section' | 'article' | 'div' };

export function Card({ children, className = '', as: Tag = 'section' }: CardProps) {
  return <Tag className={`bg-surface rounded-card border border-line/70 shadow-card p-5 sm:p-6 ${className}`}>{children}</Tag>;
}

type SectionHeaderProps = { eyebrow?: string; title: string; description?: string; action?: ReactNode; level?: 1 | 2 };

export function SectionHeader({ eyebrow, title, description, action, level = 2 }: SectionHeaderProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-1.5">{eyebrow}</p>}
        <Heading className="font-display text-[1.75rem] sm:text-[2rem] leading-none tracking-[-0.01em] text-ink">{title}</Heading>
        {description && <p className="mt-2 text-sm text-ink-soft max-w-[52ch]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type AlertProps = { tone?: 'danger' | 'success' | 'info'; children: ReactNode; className?: string };

const ALERT_TONES = {
  danger: { role: 'alert', cls: 'bg-danger-soft text-danger border-danger/20' },
  success: { role: 'status', cls: 'bg-success-soft text-success border-success/20' },
  info: { role: 'note', cls: 'bg-info-soft text-info border-info/20' },
} as const;

export function Alert({ tone = 'danger', children, className = '' }: AlertProps) {
  const { role, cls } = ALERT_TONES[tone];
  return <div role={role} className={`px-3.5 py-3 text-[13px] leading-snug rounded-field border animate-fade ${cls} ${className}`}>{children}</div>;
}

type EmptyStateProps = { icon?: ReactNode; title: string; description?: string; action?: ReactNode };

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-6 py-10 rounded-card border border-dashed border-line-strong bg-canvas/60">
      {icon && <span className="grid place-items-center w-11 h-11 rounded-2xl bg-surface border border-line text-accent mb-1">{icon}</span>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="text-[13px] text-muted max-w-[40ch]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block rounded-lg bg-sunken animate-pulse ${className}`} />;
}
