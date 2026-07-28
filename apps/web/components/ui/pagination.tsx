'use client';

import { Button } from './button';

type PaginationProps = {
  disabled?: boolean;
  label: string;
  onPageChange?: (page: number) => void;
  page: number;
  totalPages: number;
};

/** Navegação paginada consistente para filas e listas operacionais. */
export function Pagination({
  disabled = false,
  label,
  onPageChange,
  page,
  totalPages,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
    >
      <Button
        disabled={disabled || !onPageChange || page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        variant="secondary"
      >
        Anterior
      </Button>
      <span aria-live="polite" className="text-sm font-bold text-vale-muted">
        Página {page} de {totalPages}
      </span>
      <Button
        disabled={disabled || !onPageChange || page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
        variant="secondary"
      >
        Próxima
      </Button>
    </nav>
  );
}
