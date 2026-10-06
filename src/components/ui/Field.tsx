import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const fieldClass =
  'block w-full min-h-11 rounded-field border border-line-strong/80 bg-surface px-3.5 py-2.5 text-[15px] sm:text-sm text-ink placeholder:text-muted/80 transition-[border-color,box-shadow] duration-200 hover:border-ink-soft/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 disabled:bg-sunken';

const labelClass = 'block text-[13px] font-medium text-ink-soft mb-1.5';

type BaseProps = { id: string; label: string; hint?: string; icon?: ReactNode; trailing?: ReactNode };

/** Campo con etiqueta asociada por htmlFor; el texto de la etiqueta es el nombre accesible. */
export function TextField({ id, label, hint, icon, trailing, className = '', ...input }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        <input id={id} className={`${fieldClass} ${icon ? 'pl-10' : ''} ${trailing ? 'pr-11' : ''}`} {...input} />
        {trailing && <span className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</span>}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SelectField({ id, label, hint, icon, className = '', children, ...select }: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        <select id={id} className={`${fieldClass} appearance-none pr-10 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236f7975' stroke-width='1.8' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.9rem_center] ${icon ? 'pl-10' : ''}`} {...select}>
          {children}
        </select>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextAreaField({ id, label, hint, className = '', ...area }: Omit<BaseProps, 'icon' | 'trailing'> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <textarea id={id} className={`${fieldClass} resize-y`} {...area} />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
