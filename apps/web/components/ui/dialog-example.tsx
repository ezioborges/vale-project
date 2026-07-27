'use client';

import { useState } from 'react';

import { Button } from './button';
import { Dialog } from './dialog';

/** Exemplo interativo reutilizado pelo laboratório para documentar o diálogo. */
export function DialogExample() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)} variant="danger">
        Abrir confirmação
      </Button>
      {confirmed ? (
        <p
          className="mt-3 text-sm font-semibold text-vale-success"
          role="status"
        >
          A ação de exemplo foi confirmada.
        </p>
      ) : null}
      <Dialog
        confirmLabel="Confirmar ação"
        description="Use confirmações apenas quando a ação for difícil de desfazer."
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setConfirmed(true);
          setOpen(false);
        }}
        open={open}
        title="Confirmar remoção"
        tone="danger"
      >
        <p className="leading-6 text-vale-muted">
          Esta prévia não altera dados. Em produção, descreva o que será
          removido e a consequência da confirmação.
        </p>
      </Dialog>
    </div>
  );
}
