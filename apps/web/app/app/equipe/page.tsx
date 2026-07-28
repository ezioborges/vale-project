import { Badge } from '@/components/ui/badge';
import { ActionLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/feedback';
import { PageHeading } from '@/components/ui/page-heading';

const queues = [
  {
    description:
      'Revise o conteúdo antes da publicação e informe um motivo objetivo para cada decisão.',
    href: '/app/equipe/moderacao',
    label: 'Moderar vagas',
    title: 'Oportunidades aguardando revisão',
  },
  {
    description:
      'Priorize riscos, mantenha o contexto mínimo necessário e registre autoria, data e motivo.',
    href: '/app/equipe/denuncias',
    label: 'Analisar denúncias',
    title: 'Denúncias em triagem',
  },
];

export default function TeamHome() {
  return (
    <section className="mx-auto max-w-vale-content">
      <PageHeading
        as="h1"
        description="Conduza decisões rastreáveis sem expor dados fora do contexto de trabalho. A API continua autorizando cada ação."
        eyebrow="Coordenação"
        title="Área da equipe"
      />

      <Alert className="mt-6" title="Fila de trabalho segura" tone="info">
        Use os filtros de cada fila para reduzir o recorte. Responsável, data e
        motivo aparecem no histórico quando a API permite apresentá-los.
      </Alert>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {queues.map((queue) => (
          <Card className="flex h-full flex-col p-6" key={queue.href}>
            <Badge tone="warning">Ação da equipe</Badge>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-vale-ink">
              {queue.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-vale-muted">
              {queue.description}
            </p>
            <ActionLink className="mt-6" href={queue.href} variant="secondary">
              {queue.label}
            </ActionLink>
          </Card>
        ))}
      </div>
    </section>
  );
}
