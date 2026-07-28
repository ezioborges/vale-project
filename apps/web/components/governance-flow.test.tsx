import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { AdminUsers } from './admin-users';
import { AuditBrowser } from './audit-browser';
import { ReportStatusBadge } from './governance-status';
import { MyReports } from './my-reports';
import { ReportModerationQueue } from './report-moderation-queue';
import { Pagination } from './ui/pagination';

describe('jornada de governança', () => {
  it('expõe acompanhamento mínimo de denúncias e filtros de triagem', () => {
    const reportsMarkup = renderToStaticMarkup(<MyReports />);
    const moderationMarkup = renderToStaticMarkup(<ReportModerationQueue />);

    expect(reportsMarkup).toContain('Minhas denúncias');
    expect(reportsMarkup).toContain('Filtrar por status');
    expect(reportsMarkup).toContain(
      'descrição, a prioridade e as notas internas',
    );
    expect(moderationMarkup).toContain('Fila de denúncias');
    expect(moderationMarkup).toContain('Prioridade');
    expect(moderationMarkup).toContain(
      'A retirada de uma vaga da busca exige confirmação explícita',
    );
  });

  it('mantém as superfícies administrativas e a consulta de auditoria explícitas', () => {
    const usersMarkup = renderToStaticMarkup(<AdminUsers />);
    const auditMarkup = renderToStaticMarkup(<AuditBrowser />);

    expect(usersMarkup).toContain('Usuários e acessos');
    expect(usersMarkup).toContain('Mudanças de papel e estado exigem motivo');
    expect(usersMarkup).toContain('Aplicar filtros');
    expect(auditMarkup).toContain('Auditoria');
    expect(auditMarkup).toContain('Ação exata');
    expect(auditMarkup).toContain('Use filtros para consultar eventos');
  });

  it('reutiliza estado textual e paginação com nomes acessíveis', () => {
    const markup = renderToStaticMarkup(
      <>
        <ReportStatusBadge status="in_review" />
        <Pagination
          label="Paginação da fila de teste"
          onPageChange={() => undefined}
          page={2}
          totalPages={4}
        />
      </>,
    );

    expect(markup).toContain('Em análise');
    expect(markup).toContain('aria-label="Paginação da fila de teste"');
    expect(markup).toContain('Página 2 de 4');
  });
});
