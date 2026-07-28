import { Badge } from '@/components/ui/badge';
import { ActionLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/feedback';
import { PageHeading } from '@/components/ui/page-heading';

const workspaces = [
  {
    description:
      'Altere papéis e estados com motivo obrigatório, confirmação contextual e trilha de auditoria.',
    href: '/admin/usuarios',
    label: 'Gerenciar usuários',
    title: 'Usuários e acessos',
  },
  {
    description:
      'Priorize relatos, preserve o contexto mínimo necessário e registre cada decisão.',
    href: '/app/equipe/denuncias',
    label: 'Abrir fila de denúncias',
    title: 'Fila de denúncias',
  },
  {
    description:
      'Consulte eventos administrativos por autor, titular, ação e período sem revelar conteúdo sensível.',
    href: '/admin/auditoria',
    label: 'Consultar auditoria',
    title: 'Auditoria',
  },
];

export default function AdminHome() {
  return (
    <section className="mx-auto max-w-vale-wide">
      <PageHeading
        as="h1"
        description="Gerencie acessos, acompanhe decisões sensíveis e consulte trilhas de auditoria sem expor o conteúdo privado dos relatos."
        eyebrow="Governança"
        title="Administração e segurança"
      />

      <Alert className="mt-6" title="Dados mínimos por tarefa" tone="info">
        Abra apenas a fila ou a conta necessária para a decisão. A interface
        melhora a operação, mas a autorização continua sob controle da API.
      </Alert>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <Card className="flex h-full flex-col p-6" key={workspace.href}>
            <Badge tone="accent">Operação restrita</Badge>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-vale-ink">
              {workspace.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-vale-muted">
              {workspace.description}
            </p>
            <ActionLink
              className="mt-6"
              href={workspace.href}
              variant="secondary"
            >
              {workspace.label}
            </ActionLink>
          </Card>
        ))}
      </div>
    </section>
  );
}
