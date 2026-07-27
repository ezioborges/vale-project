import { Badge } from '@/components/ui/badge';
import { ActionLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeading } from '@/components/ui/page-heading';

export default function TeamHome() {
  return (
    <Card className="max-w-3xl p-6 sm:p-8">
      <Badge tone="info">Coordenação</Badge>
      <PageHeading
        as="h1"
        className="mt-5"
        description="Revise oportunidades antes da publicação e acompanhe decisões rastreáveis. A API continua autorizando cada ação."
        title="Área da equipe"
      />
      <div className="mt-7 flex flex-wrap gap-3">
        <ActionLink href="/app/equipe/moderacao">Moderar vagas</ActionLink>
        <ActionLink href="/app/equipe/denuncias" variant="secondary">
          Analisar denúncias
        </ActionLink>
      </div>
    </Card>
  );
}
