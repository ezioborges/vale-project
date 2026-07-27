import { PublicIdentityLayout } from '@/components/identity-layout';
import { Badge } from '@/components/ui/badge';
import { ActionLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/feedback';

export default function AccountUnavailable() {
  return (
    <PublicIdentityLayout>
      <Card className="p-6 sm:p-8">
        <Badge tone="warning">Estado da conta</Badge>
        <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] text-vale-ink sm:text-4xl">
          Esta conta está indisponível
        </h1>
        <p className="mt-4 text-base leading-7 text-vale-muted">
          Contas suspensas ou desabilitadas não podem acessar áreas protegidas.
        </p>
        <Alert className="mt-6" title="O acesso foi limitado" tone="warning">
          Se acreditar que houve um engano, entre em contato com o suporte pelo
          canal indicado para sua organização ou comunidade.
        </Alert>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionLink href="/" variant="secondary">
            Voltar à entrada
          </ActionLink>
          <ActionLink href="/?acao=entrar#acesso">
            Tentar entrar novamente
          </ActionLink>
        </div>
      </Card>
    </PublicIdentityLayout>
  );
}
