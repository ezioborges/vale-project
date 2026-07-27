import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement, useId } from 'react';

import { classNames } from './class-names';

type FieldControlProps = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  id?: string;
};

type FormFieldProps = {
  children: ReactElement<FieldControlProps>;
  className?: string;
  error?: ReactNode;
  hint?: ReactNode;
  id?: string;
  label: ReactNode;
  required?: boolean;
};

/**
 * Vincula rótulo, ajuda e erro ao controle. O filho deve ser uma entrada,
 * área de texto ou seletor do sistema.
 */
export function FormField({
  children,
  className,
  error,
  hint,
  id,
  label,
  required = false,
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? children.props.id ?? `field-${generatedId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [children.props['aria-describedby'], hintId, errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames('grid gap-2', className)}>
      <label
        className="text-sm font-extrabold text-vale-ink"
        htmlFor={controlId}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-vale-danger">
            *
          </span>
        ) : null}
      </label>
      {isValidElement<FieldControlProps>(children)
        ? cloneElement(children, {
            'aria-describedby': describedBy || undefined,
            'aria-invalid': error ? true : children.props['aria-invalid'],
            id: controlId,
          })
        : children}
      {hint ? (
        <p className="text-sm leading-6 text-vale-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="text-sm font-semibold leading-6 text-vale-danger"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextInputProps = ComponentPropsWithoutRef<'input'> & {
  leadingIcon?: ReactNode;
};

export function TextInput({
  className,
  leadingIcon,
  ...props
}: TextInputProps) {
  const input = (
    <input
      className={classNames(
        'min-h-12 w-full rounded-vale-md border border-vale-border bg-vale-surface px-4 py-3 text-vale-ink outline-none transition placeholder:text-vale-muted/70 hover:border-vale-border-strong focus:border-vale-action focus:ring-3 focus:ring-vale-focus/15 disabled:cursor-not-allowed disabled:bg-vale-disabled disabled:text-vale-muted',
        Boolean(leadingIcon) && 'pl-11',
        className,
      )}
      {...props}
    />
  );

  if (!leadingIcon) return input;

  return (
    <span className="relative block">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-vale-muted"
      >
        {leadingIcon}
      </span>
      {input}
    </span>
  );
}

export function TextArea({
  className,
  ...props
}: ComponentPropsWithoutRef<'textarea'>) {
  return (
    <textarea
      className={classNames(
        'min-h-28 w-full resize-y rounded-vale-md border border-vale-border bg-vale-surface px-4 py-3 text-vale-ink outline-none transition placeholder:text-vale-muted/70 hover:border-vale-border-strong focus:border-vale-action focus:ring-3 focus:ring-vale-focus/15 disabled:cursor-not-allowed disabled:bg-vale-disabled disabled:text-vale-muted',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'select'>) {
  return (
    <select
      className={classNames(
        'min-h-12 w-full rounded-vale-md border border-vale-border bg-vale-surface px-4 py-3 text-vale-ink outline-none transition hover:border-vale-border-strong focus:border-vale-action focus:ring-3 focus:ring-vale-focus/15 disabled:cursor-not-allowed disabled:bg-vale-disabled disabled:text-vale-muted',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

type CheckboxFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  className?: string;
  error?: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
};

export function CheckboxField({
  className,
  error,
  hint,
  id,
  label,
  ...props
}: CheckboxFieldProps) {
  const generatedId = useId();
  const controlId = id ?? `checkbox-${generatedId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className={classNames('grid gap-2', className)}>
      <label
        className="flex items-start gap-3 text-sm leading-6 text-vale-ink"
        htmlFor={controlId}
      >
        <input
          aria-describedby={
            [hintId, errorId].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={error ? true : undefined}
          className="mt-1 size-4 shrink-0 accent-vale-action"
          id={controlId}
          type="checkbox"
          {...props}
        />
        <span>{label}</span>
      </label>
      {hint ? (
        <p className="pl-7 text-sm leading-6 text-vale-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="pl-7 text-sm font-semibold leading-6 text-vale-danger"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type RadioCardProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  children?: ReactNode;
  description: ReactNode;
  label: ReactNode;
};

export function RadioCard({
  children,
  description,
  label,
  ...props
}: RadioCardProps) {
  const generatedId = useId();
  const id = props.id ?? `option-${generatedId}`;

  return (
    <label
      className="flex cursor-pointer gap-3 rounded-vale-lg border border-vale-border bg-vale-surface p-4 transition hover:border-vale-action has-[:checked]:border-2 has-[:checked]:border-vale-action has-[:checked]:bg-vale-action-subtle"
      htmlFor={id}
    >
      <input
        className="mt-1 shrink-0 accent-vale-action"
        id={id}
        type="radio"
        {...props}
      />
      <span>
        <span className="flex items-center gap-2 text-sm font-extrabold text-vale-ink">
          {children}
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-vale-muted">
          {description}
        </span>
      </span>
    </label>
  );
}
