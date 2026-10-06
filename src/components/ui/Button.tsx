import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_8px_20px_-10px_rgb(15_92_87/0.7)]',
  secondary: 'bg-surface text-ink border border-line-strong hover:border-ink-soft hover:bg-sunken',
  ghost: 'text-ink-soft hover:text-ink hover:bg-sunken',
  danger: 'bg-danger text-white hover:brightness-95',
  dark: 'bg-ink text-white hover:bg-night-soft',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-xs gap-1.5',
  md: 'min-h-11 px-4 text-sm gap-2',
  lg: 'min-h-12 px-5 text-[15px] gap-2',
};

export function Spinner({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`} />;
}

export function Button({ variant = 'primary', size = 'md', isLoading = false, loadingLabel, icon, fullWidth = false, className = '', children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-field font-medium tracking-[-0.005em] transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {isLoading ? <Spinner /> : icon}
      {isLoading && loadingLabel ? <span>{loadingLabel}</span> : children}
    </button>
  );
}
