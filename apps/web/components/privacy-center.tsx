'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { PrivacySummary } from '@vale/shared';

import { getPrivacySummary } from '@/lib/api';

import { ActionLink, Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { PageHeading } from './ui/page-heading';

type LoadState = 'error' | 'loading' | 'ready';

export function PrivacyCenter() {
  const [summary, setSummary] = useState<PrivacySummary | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      setSummary(await getPrivacySummary());
      setState('ready');
    } catch (requestError) {
      setState('error');
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível carregar esta área.',
      );
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <div className="mx-auto max-w-vale-content">
      <PageHeading
        as="h1"
        description="Entenda os tratamentos já mapeados, corrija seu perfil e acompanhe a disponibilidade dos demais controles."
        eyebrow="Sua privacidade"
        title="Dados e controles da conta"
      />

      <Alert className="mt-6" title="Escolhas de visibilidade" tone="info">
        A visibilidade do perfil é alterada na edição do perfil. Antes de
        ativar ou publicar, confira a prévia e a regra de acesso de cada opção.
      </Alert>

      {state === 'loading' ? (
        <div className="mt-8">
          <LoadingState label="Carregando informações de privacidade" />
        </div>
      ) : null}

      {state === 'error' ? (
        <Alert className="mt-8" title="Não foi possível carregar a privacidade" tone="danger">
          <p>{error}</p>
          <Button className="mt-4" onClick={() => void loadSummary()} variant="secondary">
            Tentar novamente
          </Button>
        </Alert>
      ) : null}

      {summary && state === 'ready' ? <PrivacyContent summary={summary} /> : null}
    </div>
  );
}

function PrivacyContent({ summary }: { summary: PrivacySummary }) {
  const unavailableControls: Array<[string, boolean]> = [
    ['Exportação de dados', summary.account.exportAvailable],
    ['Exclusão da conta', summary.account.deletionAvailable],
    ['Consentimentos opcionais', summary.account.optionalConsentAvailable],
  ];

  return (
    <div className="mt-8 grid gap-6">
      <section aria-labelledby="processing-heading">
        <h2
          className="text-xl font-black tracking-[-0.03em] text-vale-ink sm:text-2xl"
          id="processing-heading"
        >
          Tratamentos mapeados
        </h2>
        {summary.processing.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {summary.processing.map((item) => (
              <Card className="p-5" key={item.category}>
                <p className="text-sm font-extrabold text-vale-ink">
                  {item.category}
                </p>
                <p className="mt-2 text-sm leading-6 text-vale-muted">
                  {item.purpose}
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-vale-warning">
                  Aguardando aprovação formal
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              description="Nenhum tratamento foi publicado neste momento. Tente novamente mais tarde."
              title="Ainda não há tratamentos a exibir"
            />
          </div>
        )}
      </section>

      <section aria-labelledby="account-controls-heading">
        <Card className="p-6 sm:p-7">
          <h2
            className="text-xl font-black tracking-[-0.03em] text-vale-ink sm:text-2xl"
            id="account-controls-heading"
          >
            Controles da conta
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-vale-muted">
            Você pode corrigir os dados editáveis agora. Os demais controles só
            serão disponibilizados depois da aprovação das políticas aplicáveis.
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {unavailableControls.map(([label, available]) => (
              <div
                className="rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4"
                key={label}
              >
                <dt className="text-sm font-extrabold text-vale-ink">{label}</dt>
                <dd className="mt-2 text-sm text-vale-muted">
                  {available ? 'Disponível' : 'Ainda indisponível'}
                </dd>
              </div>
            ))}
          </dl>
          <ActionLink className="mt-6" href={summary.account.correctionPath}>
            Corrigir dados do perfil
          </ActionLink>
        </Card>
      </section>

      <Alert title="Canal assistido em preparação" tone="warning">
        Os prazos operacionais e o canal de atendimento serão publicados após a
        aprovação do controlador e do encarregado. Esta página não promete
        exclusão imediata.
      </Alert>
      <Link className="text-sm font-extrabold text-vale-action underline underline-offset-4" href={summary.account.correctionPath}>
        Voltar para a edição do perfil
      </Link>
    </div>
  );
}
