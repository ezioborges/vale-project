'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

import { Button } from './button';

type DialogProps = {
  children: ReactNode;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  confirmLoading?: boolean;
  description?: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  open: boolean;
  title: ReactNode;
  tone?: 'default' | 'danger';
};

/**
 * Sobreposição controlada que usa o elemento nativo `dialog`: foco permanece
 * dentro do modal, Escape solicita fechamento e a ação destrutiva é explícita.
 */
export function Dialog({
  children,
  confirmDisabled = false,
  confirmLabel = 'Confirmar',
  confirmLoading = false,
  description,
  onClose,
  onConfirm,
  open,
  title,
  tone = 'default',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className="m-auto w-[min(100%-2rem,36rem)] rounded-vale-lg border border-vale-border bg-vale-surface p-0 text-vale-ink shadow-vale-dialog backdrop:bg-vale-ink/50"
      onCancel={(event) => {
        event.preventDefault();
        if (!confirmLoading) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !confirmLoading) onClose();
      }}
      ref={dialogRef}
    >
      <div className="grid gap-5 p-6 sm:p-8">
        <div>
          <h2 className="text-xl font-black tracking-[-0.03em]" id={titleId}>
            {title}
          </h2>
          {description ? (
            <p className="mt-2 leading-6 text-vale-muted" id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>
        <div>{children}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={confirmLoading}
            onClick={onClose}
            variant="secondary"
          >
            Cancelar
          </Button>
          {onConfirm ? (
            <Button
              disabled={confirmDisabled}
              loading={confirmLoading}
              loadingLabel={confirmLabel}
              onClick={onConfirm}
              variant={tone === 'danger' ? 'danger' : 'primary'}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
