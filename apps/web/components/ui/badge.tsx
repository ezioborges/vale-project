import type { ReactNode } from 'react';

import { classNames } from './class-names';

export type BadgeTone =
  | 'accent'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

type BadgeProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  accent: 'bg-vale-action-subtle text-vale-action ring-vale-action/20',
  success: 'bg-vale-success-subtle text-vale-success ring-vale-success/20',
  info: 'bg-vale-info-subtle text-vale-info ring-vale-info/20',
  warning: 'bg-vale-warning-subtle text-vale-warning ring-vale-warning/20',
  danger: 'bg-vale-danger-subtle text-vale-danger ring-vale-danger/20',
  neutral: 'bg-vale-neutral-subtle text-vale-muted ring-vale-border',
};

export function Badge({
  children,
  className,
  icon,
  tone = 'neutral',
}: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset',
        toneClasses[tone],
        className,
      )}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
