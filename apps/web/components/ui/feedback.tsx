import type { ReactNode } from 'react';

import { classNames } from './class-names';

export type FeedbackTone = 'success' | 'info' | 'warning' | 'danger';

type AlertProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title: ReactNode;
  tone?: FeedbackTone;
};

const alertToneClasses: Record<FeedbackTone, string> = {
  success:
    'border-vale-success/25 bg-vale-success-subtle text-vale-success-strong',
  info: 'border-vale-info/25 bg-vale-info-subtle text-vale-info-strong',
  warning:
    'border-vale-warning/25 bg-vale-warning-subtle text-vale-warning-strong',
  danger: 'border-vale-danger/25 bg-vale-danger-subtle text-vale-danger-strong',
};

export function Alert({
  children,
  className,
  icon,
  title,
  tone = 'info',
}: AlertProps) {
  return (
    <section
      className={classNames(
        'rounded-vale-md border p-5',
        alertToneClasses[tone],
        className,
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span aria-hidden="true" className="mt-1">
            {icon}
          </span>
        ) : null}
        <div>
          <h3 className="font-extrabold">{title}</h3>
          <div className="mt-2 text-sm leading-6 opacity-80">{children}</div>
        </div>
      </div>
    </section>
  );
}

type EmptyStateProps = {
  action?: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
};

export function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <section className="grid place-items-center rounded-vale-lg border border-dashed border-vale-border bg-vale-surface px-5 py-12 text-center">
      {icon ? (
        <span
          aria-hidden="true"
          className="grid size-16 place-items-center rounded-vale-lg bg-vale-action-subtle text-2xl text-vale-action"
        >
          {icon}
        </span>
      ) : null}
      <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-vale-ink">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-vale-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export function LoadingState({
  label = 'Carregando conteúdo',
}: {
  label?: string;
}) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-24 items-center justify-center gap-3 text-sm font-semibold text-vale-muted"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-vale-action-subtle border-t-vale-action motion-reduce:animate-none"
      />
      {label}
    </div>
  );
}

type ProgressProps = {
  label: string;
  value: number;
};

export function Progress({ label, value }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-vale-ink">{label}</span>
        <span className="font-bold text-vale-muted">{safeValue}%</span>
      </div>
      <progress
        aria-label={label}
        className="h-2 w-full accent-vale-action"
        max="100"
        value={safeValue}
      >
        {safeValue}%
      </progress>
    </div>
  );
}
