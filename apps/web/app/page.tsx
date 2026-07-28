import Link from 'next/link';

import { AuthPanel } from '@/components/auth-panel';
import { PublicHeader } from '@/components/identity-layout';
import { Badge } from '@/components/ui/badge';
import { PrismaticSeedMark } from '@/components/ui/brand';
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
      <section className="prismatic-hero overflow-hidden border-b border-vale-border py-10 sm:py-16 lg:py-20">
        <Container size="wide">
          <div className="relative z-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.8fr)] lg:gap-16">
            <div className="relative max-w-2xl">
              <div className="flex items-center gap-4">
                <PrismaticSeedMark className="h-16 w-auto shrink-0 sm:h-20" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-vale-muted">
                    Semente prismática
                  </p>
                  <Badge className="mt-2" tone="accent">
                    O melhor de cada trajetória
                  </Badge>
                </div>
              </div>
              <h1 className="prismatic-wordmark mt-6 text-4xl font-bold leading-[0.98] tracking-[-0.055em] text-vale-ink sm:text-5xl lg:text-7xl">
                Faça florescer o seu próximo passo.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-vale-muted">
                Primícias conecta talentos e oportunidades para que cada pessoa
                possa cultivar seu caminho e compartilhar o que tem de melhor.
              </p>
              <div aria-hidden="true" className="prismatic-spectrum mt-7">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
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

      <section
        aria-labelledby="commitments-title"
        className="relative bg-white/55 py-12 sm:py-16"
      >
        <Container size="wide">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-vale-action">
              Plantamos confiança desde o começo
            </p>
            <h2
              className="prismatic-wordmark mt-3 text-3xl font-bold tracking-[-0.045em] text-vale-ink sm:text-5xl"
              id="commitments-title"
            >
              Toda trajetória merece cuidado para florescer.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {commitments.map((commitment, index) => (
              <Card className="p-5" key={commitment.title}>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-vale-info">
                  0{index + 1} · cuidado em cada etapa
                </p>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.025em] text-vale-ink">
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
