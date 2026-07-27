import Link from 'next/link';

import { AuthPanel } from '@/components/auth-panel';
import { PublicHeader } from '@/components/identity-layout';
import { Badge } from '@/components/ui/badge';
import { ActionLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container, PageLayout } from '@/components/ui/layout';

const commitments = [
  {
    description:
      'Escolha como participar antes do cadastro e siga para uma área adequada ao seu papel.',
    title: 'Caminho claro desde o começo',
  },
  {
    description:
      'Os termos, a privacidade e as diretrizes são apresentados e aceitos separadamente.',
    title: 'Consentimento com contexto',
  },
  {
    description:
      'Você controla o acesso à conta e encontra orientação quando algo precisa de atenção.',
    title: 'Acesso com segurança',
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    acao?: string;
    email?: string;
    senha?: string;
    sessao?: string;
  }>;
}) {
  const { acao, email, senha, sessao } = await searchParams;
  const initialNotice =
    senha === 'alterada'
      ? {
          detail:
            'Use sua nova senha para entrar. As sessões anteriores foram encerradas por segurança.',
          title: 'Senha atualizada',
          tone: 'success' as const,
        }
      : email === 'verificado'
        ? {
            detail: 'Entre para continuar na área correspondente à sua conta.',
            title: 'E-mail confirmado',
            tone: 'success' as const,
          }
        : sessao === 'expirada'
          ? {
              detail: 'Entre novamente para continuar com segurança.',
              title: 'Sua sessão terminou',
              tone: 'info' as const,
            }
          : undefined;

  return (
    <PageLayout kind="public">
      <PublicHeader />
      <section className="overflow-hidden border-b border-vale-border bg-gradient-to-br from-vale-action-subtle via-vale-canvas to-vale-surface py-10 sm:py-16 lg:py-20">
        <Container size="wide">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.8fr)] lg:gap-16">
            <div className="max-w-2xl">
              <Badge tone="accent">Talentos &amp; serviços com respeito</Badge>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.055em] text-vale-ink sm:text-5xl lg:text-6xl">
                Trabalho que reconhece cada trajetória.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-vale-muted">
                Encontre oportunidades, publique vagas e acompanhe cada passo em
                uma plataforma construída com privacidade e inclusão.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ActionLink href="#acesso" size="lg">
                  Criar minha conta
                </ActionLink>
                <ActionLink href="/vagas" size="lg" variant="secondary">
                  Explorar vagas
                </ActionLink>
              </div>
              <p className="mt-5 text-sm leading-6 text-vale-muted">
                Já possui uma conta?{' '}
                <Link
                  className="font-extrabold text-vale-action underline decoration-2 underline-offset-4 hover:text-vale-action-hover"
                  href="/?acao=entrar#acesso"
                >
                  Entre por aqui.
                </Link>
              </p>
            </div>
            <AuthPanel
              initialMode={
                acao === 'entrar' || sessao === 'expirada'
                  ? 'login'
                  : 'register'
              }
              initialNotice={initialNotice}
            />
          </div>
        </Container>
      </section>

      <section aria-labelledby="commitments-title" className="py-12 sm:py-16">
        <Container size="wide">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-vale-action">
              Uma entrada bem acompanhada
            </p>
            <h2
              className="mt-3 text-3xl font-black tracking-[-0.045em] text-vale-ink sm:text-4xl"
              id="commitments-title"
            >
              Você sabe o que acontece em cada próximo passo.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {commitments.map((commitment) => (
              <Card className="p-5" key={commitment.title}>
                <h3 className="text-lg font-black tracking-[-0.025em] text-vale-ink">
                  {commitment.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-vale-muted">
                  {commitment.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}
