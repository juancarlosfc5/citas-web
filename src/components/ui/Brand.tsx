type Props = { caption?: string; tone?: 'light' | 'dark'; compact?: boolean };

export function BrandMark({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative grid place-items-center rounded-[0.8rem] bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] ${className}`}>
      <svg viewBox="0 0 24 24" className="w-[55%] h-[55%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M12 10.5v6M9 13.5h6" />
      </svg>
    </span>
  );
}

export function Brand({ caption, tone = 'dark', compact = false }: Props) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <BrandMark className={compact ? 'w-9 h-9' : 'w-10 h-10'} />
      <div className="min-w-0 leading-tight">
        <span className={`block font-semibold tracking-[-0.01em] truncate ${tone === 'light' ? 'text-white' : 'text-ink'} ${compact ? 'text-sm' : 'text-[15px]'}`}>Portal de Citas</span>
        {caption && <span className={`block text-xs truncate ${tone === 'light' ? 'text-white/60' : 'text-muted'}`}>{caption}</span>}
      </div>
    </div>
  );
}
