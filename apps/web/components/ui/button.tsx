import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';

import { classNames } from './class-names';

export type ActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ActionSize = 'sm' | 'md' | 'lg';

type ActionStyleProps = {
  variant?: ActionVariant;
  size?: ActionSize;
  fullWidth?: boolean;
};

const baseClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-vale-md px-4 text-sm font-extrabold transition motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus disabled:cursor-not-allowed disabled:opacity-55';

const variantClasses: Record<ActionVariant, string> = {
  primary:
    'prismatic-action border-0 bg-vale-action !text-white shadow-vale-action hover:bg-vale-action-hover',
  secondary:
    'border border-vale-border bg-vale-surface !text-vale-ink hover:border-vale-action hover:!text-vale-action',
  ghost:
    'border-0 bg-transparent !text-vale-action hover:bg-vale-action-subtle',
  danger: 'border-0 bg-vale-danger !text-white hover:bg-vale-danger-strong',
};

const sizeClasses: Record<ActionSize, string> = {
  sm: 'min-h-10 px-3 text-xs',
  md: 'min-h-11 px-4',
  lg: 'min-h-12 px-5',
};

export function actionClassName({
  className,
  fullWidth = false,
  size = 'md',
  variant = 'primary',
}: ActionStyleProps & { className?: string }) {
  return classNames(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ActionStyleProps & {
    children: ReactNode;
    loading?: boolean;
    loadingLabel?: string;
  };

export function Button({
  children,
  className,
  disabled,
  fullWidth,
  loading = false,
  loadingLabel = 'Carregando',
  size,
  type = 'button',
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      className={actionClassName({ className, fullWidth, size, variant })}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <span className="sr-only">{loadingLabel}</span> : null}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ButtonProps, 'aria-label' | 'children'> & {
  children: ReactNode;
  label: string;
};

/** Um botão sem texto sempre recebe nome acessível e dica visual. */
export function IconButton({
  className,
  label,
  title = label,
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      className={classNames('aspect-square px-0', className)}
      title={title}
      {...props}
    />
  );
}

type ActionLinkProps = ComponentProps<typeof Link> & ActionStyleProps;

export function ActionLink({
  className,
  fullWidth,
  size,
  variant,
  ...props
}: ActionLinkProps) {
  return (
    <Link
      className={actionClassName({ className, fullWidth, size, variant })}
      {...props}
    />
  );
}
