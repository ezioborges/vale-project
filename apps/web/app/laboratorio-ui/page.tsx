import {
  faArrowRight,
  faBell,
  faBookmark,
  faBriefcase,
  faBuilding,
  faCheck,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faCode,
  faEnvelope,
  faEye,
  faFilter,
  faGlobe,
  faHouse,
  faInfoCircle,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
  faPalette,
  faShieldHalved,
  faSliders,
  faUniversalAccess,
  faUser,
  faUserPlus,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ApplicationStatusBadge,
  JobStatusBadge,
} from '@/components/market-status';
import { Badge } from '@/components/ui/badge';
import { ActionLink, Button, IconButton } from '@/components/ui/button';
import { Brand } from '@/components/ui/brand';
import { Card } from '@/components/ui/card';
import {
  CheckboxField,
  FormField,
  RadioCard,
  Select,
  TextArea,
  TextInput,
} from '@/components/ui/form-field';
import {
  Alert,
  EmptyState,
  LoadingState,
  Progress,
} from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Container, PageLayout } from '@/components/ui/layout';
import { PageHeading } from '@/components/ui/page-heading';
import { DialogExample } from '@/components/ui/dialog-example';

export const metadata: Metadata = {
  title: 'Laboratório UI | Vale',
  description:
    'Referência visual e de experiência para as interfaces da plataforma Vale.',
};

const navigation = [
  { label: 'Fundações', href: '#fundacoes', icon: faPalette },
  { label: 'Componentes', href: '#componentes', icon: faCode },
  { label: 'Cadastro', href: '#cadastro', icon: faUserPlus },
  { label: 'Produto', href: '#produto', icon: faBriefcase },
  { label: 'Estados', href: '#estados', icon: faCircleCheck },
  { label: 'Aplicação', href: '#aplicacao', icon: faArrowRight },
];

const colors = [
  { name: 'Violeta Vale', hex: '#5B3DF5', className: 'bg-vale-violet' },
  { name: 'Rosa orgulho', hex: '#D6249F', className: 'bg-vale-pink' },
  { name: 'Azul confiança', hex: '#2368E8', className: 'bg-vale-blue' },
  { name: 'Verde avanço', hex: '#12815E', className: 'bg-vale-green' },
  { name: 'Laranja energia', hex: '#E95F16', className: 'bg-vale-orange' },
  { name: 'Amarelo luz', hex: '#F7C948', className: 'bg-vale-yellow' },
];

const rollout = [
  {
    phase: '01',
    title: 'Fundação',
    description:
      'Consolidar tokens, Tailwind, iconografia e regras de conteúdo inclusivo.',
  },
  {
    phase: '02',
    title: 'Identidade',
    description:
      'Aplicar em cadastro, login, verificação de e-mail e recuperação de senha.',
  },
  {
    phase: '03',
    title: 'Perfis',
    description:
      'Construir onboarding, privacidade, currículo e perfil de contratante.',
  },
  {
    phase: '04',
    title: 'Mercado',
    description:
      'Expandir para vagas, busca, candidaturas e gestão de oportunidades.',
  },
  {
    phase: '05',
    title: 'Governança',
    description:
      'Fechar moderação, denúncias, administração e auditoria com o mesmo padrão.',
  },
];

function SpecimenLabel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-extrabold tracking-[-0.02em] text-vale-ink">
        {title}
      </h3>
      <span className="font-mono text-[11px] text-vale-muted">{detail}</span>
    </div>
  );
}

export default function UiLaboratoryPage() {
  return (
    <PageLayout className="font-sans">
      <div
        aria-hidden="true"
        className="h-1.5 bg-gradient-to-r from-vale-pink via-vale-orange via-vale-yellow via-vale-green via-vale-blue to-vale-violet"
      />

      <header className="sticky top-0 z-50 border-b border-vale-line/80 bg-white/90 backdrop-blur-xl">
        <Container
          className="flex min-h-18 items-center justify-between gap-6 py-3"
          size="wide"
        >
          <Link
            aria-label="Voltar para a página inicial do Vale"
            className="rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-vale-blue"
            href="/"
          >
            <Brand />
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-vale-line bg-vale-canvas p-1 md:flex">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-vale-violet shadow-sm">
              Laboratório UI
            </span>
            <span className="px-3 py-1.5 text-xs font-bold text-vale-muted">
              v0.1
            </span>
          </div>

          <nav
            aria-label="Atalhos do laboratório"
            className="flex items-center gap-2"
          >
            <a
              aria-label="Ir para a seção de acessibilidade"
              className="grid size-11 place-items-center rounded-full border border-vale-line bg-white text-vale-muted transition hover:border-vale-violet hover:text-vale-violet focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-vale-blue"
              href="#acessibilidade"
              title="Acessibilidade"
            >
              <Icon icon={faUniversalAccess} />
            </a>
            <a
              className="hidden min-h-11 items-center gap-2 rounded-full bg-vale-ink px-5 text-sm font-extrabold text-white transition hover:bg-vale-violet focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-vale-blue sm:inline-flex"
              href="#aplicacao"
            >
              Ver plano
              <Icon icon={faArrowRight} />
            </a>
          </nav>
        </Container>
      </header>

      <section className="relative overflow-hidden border-b border-vale-line bg-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-20 size-80 rounded-full bg-vale-pink/8 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-vale-violet/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1480px] gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge tone="accent">Referência oficial</Badge>
              <span className="text-sm font-bold text-vale-muted">
                Empregabilidade com orgulho e segurança
              </span>
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] text-vale-ink sm:text-6xl lg:text-7xl">
              Um sistema feito para cada pessoa{' '}
              <span className="bg-gradient-to-r from-vale-violet via-vale-pink to-vale-orange bg-clip-text text-transparent">
                ocupar seu espaço.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-vale-muted">
              Este laboratório orienta as experiências de cadastro, contratação
              e prestação de serviços do Vale com uma linguagem moderna,
              acolhedora, clara e acessível.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ActionLink href="#fundacoes" size="lg">
                Explorar o sistema
                <Icon icon={faArrowRight} />
              </ActionLink>
              <a
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-vale-line bg-white px-5 text-sm font-extrabold text-vale-ink transition hover:border-vale-violet hover:text-vale-violet focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-blue"
                href="#cadastro"
              >
                <Icon icon={faUserPlus} />
                Ver cadastro
              </a>
            </div>
          </div>

          <aside className="self-end rounded-3xl border border-vale-line bg-vale-canvas/80 p-5 shadow-[0_24px_70px_rgba(33,26,53,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold">Princípios do Vale</span>
              <Icon className="text-vale-violet" icon={faShieldHalved} />
            </div>
            <ul className="mt-5 grid gap-3">
              {[
                'Acolhimento sem infantilização',
                'Dados sensíveis sempre opcionais',
                'Ação principal evidente',
                'Cor nunca comunica sozinha',
              ].map((principle) => (
                <li
                  className="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm font-semibold text-vale-muted ring-1 ring-vale-line"
                  key={principle}
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-[10px] text-vale-green">
                    <Icon icon={faCheck} />
                  </span>
                  {principle}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1480px] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-vale-line px-6 py-12 lg:block">
          <nav
            aria-label="Seções do laboratório de interface"
            className="sticky top-28"
          >
            <p className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-vale-muted">
              Nesta página
            </p>
            <ul className="grid gap-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    className="group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold text-vale-muted transition hover:bg-vale-soft hover:text-vale-violet focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-vale-blue"
                    href={item.href}
                  >
                    <Icon
                      className="text-xs text-vale-muted transition group-hover:text-vale-violet"
                      icon={item.icon}
                    />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl bg-vale-ink p-4 text-white">
              <Icon className="text-vale-yellow" icon={faInfoCircle} />
              <p className="mt-3 text-xs font-bold leading-5 text-white/70">
                Esta página é uma referência viva. Componentes aprovados devem
                virar peças reutilizáveis.
              </p>
            </div>
          </nav>
        </aside>

        <div className="min-w-0">
          <section
            className="scroll-mt-24 border-b border-vale-line px-5 py-16 lg:px-12 lg:py-20"
            id="fundacoes"
          >
            <PageHeading
              className="mb-8"
              description="A identidade usa bastante espaço em branco, contraste alto e uma paleta de orgulho aplicada com intenção. O violeta identifica ações e os demais tons organizam categorias e feedbacks."
              eyebrow="01 · Fundações"
              title="Clareza primeiro. Cor com propósito."
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {colors.map((color) => (
                <article
                  className="overflow-hidden rounded-2xl border border-vale-line bg-white"
                  key={color.name}
                >
                  <div className={`h-24 ${color.className}`} />
                  <div className="flex items-center justify-between gap-3 p-4">
                    <span className="text-sm font-extrabold">{color.name}</span>
                    <code className="text-xs font-bold text-vale-muted">
                      {color.hex}
                    </code>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="p-6 sm:p-8">
                <SpecimenLabel
                  detail="Arial / system sans"
                  title="Escala tipográfica"
                />
                <div className="grid gap-7">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-vale-muted">
                      Display · 64 / 98%
                    </span>
                    <p className="mt-2 text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">
                      Talento não cabe em caixas.
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-vale-muted">
                      Título · 32 / 110%
                    </span>
                    <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                      Encontre seu próximo projeto
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-vale-muted">
                      Corpo · 16 / 175%
                    </span>
                    <p className="mt-2 max-w-xl leading-7 text-vale-muted">
                      Linguagem direta, respeitosa e sem pressupor gênero,
                      identidade, estrutura familiar ou trajetória profissional.
                    </p>
                  </div>
                </div>
              </Card>

              <article
                className="scroll-mt-28 rounded-3xl bg-vale-ink p-6 text-white sm:p-8"
                id="acessibilidade"
              >
                <SpecimenLabel detail="WCAG 2.2 AA" title="Acessibilidade" />
                <ul className="grid gap-4">
                  {[
                    'Contraste mínimo de 4,5:1 para texto',
                    'Foco visível em todos os controles',
                    'Área de toque mínima de 44 × 44 px',
                    'Rótulos explícitos, não só placeholders',
                    'Ícone acompanhado de texto ou nome acessível',
                  ].map((item) => (
                    <li
                      className="flex gap-3 text-sm font-semibold leading-6 text-white/75"
                      key={item}
                    >
                      <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] text-vale-yellow">
                        <Icon icon={faCheck} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section
            className="scroll-mt-24 border-b border-vale-line bg-white/45 px-5 py-16 lg:px-12 lg:py-20"
            id="componentes"
          >
            <PageHeading
              className="mb-8"
              description="Os componentes combinam cantos suaves, hierarquia nítida e estados de interação visíveis. A base abaixo deve ser reutilizada, não redesenhada a cada fluxo."
              eyebrow="02 · Componentes"
              title="Uma linguagem consistente para agir."
            />

            <div className="grid gap-5 xl:grid-cols-2">
              <article className="rounded-3xl border border-vale-line bg-white p-6 sm:p-8">
                <SpecimenLabel detail="action/*" title="Botões" />
                <div className="flex flex-wrap gap-3">
                  <Button size="lg">
                    Criar perfil
                    <Icon icon={faArrowRight} />
                  </Button>
                  <Button size="lg" variant="secondary">
                    Salvar rascunho
                  </Button>
                  <Button size="lg" variant="ghost">
                    Ver detalhes
                    <Icon icon={faChevronRight} />
                  </Button>
                  <IconButton
                    label="Salvar oportunidade"
                    size="lg"
                    variant="secondary"
                  >
                    <Icon icon={faBookmark} />
                  </IconButton>
                </div>
              </article>

              <article className="rounded-3xl border border-vale-line bg-white p-6 sm:p-8">
                <SpecimenLabel detail="status/*" title="Etiquetas e estados" />
                <div className="flex flex-wrap items-center gap-3">
                  <Badge icon={<Icon icon={faCheck} />} tone="success">
                    Perfil verificado
                  </Badge>
                  <Badge tone="info">Trabalho remoto</Badge>
                  <Badge tone="accent">Nova oportunidade</Badge>
                  <Badge tone="warning">Revisão pendente</Badge>
                  <Badge tone="neutral">Rascunho</Badge>
                </div>
              </article>

              <article className="rounded-3xl border border-vale-line bg-white p-6 sm:p-8">
                <SpecimenLabel detail="input/default" title="Campos" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Buscar oportunidades">
                    <TextInput
                      leadingIcon={<Icon icon={faMagnifyingGlass} />}
                      placeholder="Cargo, serviço ou habilidade"
                      type="search"
                    />
                  </FormField>
                  <FormField label="Modalidade">
                    <Select defaultValue="remote">
                      <option value="remote">Remoto</option>
                      <option value="hybrid">Híbrido</option>
                      <option value="onsite">Presencial</option>
                    </Select>
                  </FormField>
                  <FormField
                    className="sm:col-span-2"
                    error="Descreva ao menos uma adaptação relevante."
                    hint="Explique somente o que a pessoa precisa saber para trabalhar bem."
                    label="Acessibilidade da oportunidade"
                  >
                    <TextArea placeholder="Ex.: legendas nas reuniões e horários flexíveis" />
                  </FormField>
                </div>
              </article>

              <article className="rounded-3xl border border-vale-line bg-white p-6 sm:p-8">
                <SpecimenLabel detail="icon/font-awesome" title="Iconografia" />
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: faHouse, label: 'Início' },
                    { icon: faBriefcase, label: 'Vagas' },
                    { icon: faUsers, label: 'Pessoas' },
                    { icon: faBell, label: 'Avisos' },
                    { icon: faSliders, label: 'Filtros' },
                    { icon: faEye, label: 'Visibilidade' },
                  ].map((item) => (
                    <div
                      className="grid min-w-20 place-items-center gap-2 rounded-2xl bg-vale-canvas px-3 py-4 text-vale-muted ring-1 ring-vale-line"
                      key={item.label}
                    >
                      <Icon
                        className="text-lg text-vale-violet"
                        icon={item.icon}
                      />
                      <span className="text-[11px] font-bold">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section
            className="scroll-mt-24 border-b border-vale-line px-5 py-16 lg:px-12 lg:py-20"
            id="cadastro"
          >
            <PageHeading
              className="mb-8"
              description="O primeiro fluxo respeita a Fase 1 do plano: escolha de papel, identidade mínima, consentimentos claros, confirmação de e-mail e encaminhamento para o onboarding adequado."
              eyebrow="03 · Cadastro"
              title="Começar deve parecer simples e seguro."
            />

            <div className="overflow-hidden rounded-[32px] border border-vale-line bg-white shadow-[0_24px_80px_rgba(33,26,53,0.08)]">
              <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
                <div className="relative overflow-hidden bg-vale-ink p-6 text-white sm:p-10">
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-24 -right-20 size-72 rounded-full bg-vale-violet/40 blur-3xl"
                  />
                  <div className="relative">
                    <Brand inverse />
                    <p className="mt-14 text-xs font-black uppercase tracking-[0.18em] text-vale-yellow">
                      Sua trajetória importa
                    </p>
                    <h3 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em]">
                      Vamos construir seu próximo passo.
                    </h3>
                    <p className="mt-5 max-w-md leading-7 text-white/65">
                      Você controla o que compartilha. Informações sobre
                      identidade são opcionais e nunca limitam seu acesso às
                      oportunidades.
                    </p>
                    <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="mt-1 text-vale-yellow" icon={faLock} />
                        <div>
                          <p className="text-sm font-extrabold">
                            Privacidade por padrão
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/60">
                            Seu perfil começa privado e você escolhe quem pode
                            visualizar seus dados profissionais.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-10">
                  <div
                    className="mb-8 flex items-center gap-2"
                    aria-label="Etapa 2 de 3"
                  >
                    {[
                      { number: '1', label: 'Perfil', complete: true },
                      { number: '2', label: 'Identidade', complete: false },
                      { number: '3', label: 'Confirmação', complete: false },
                    ].map((step, index) => (
                      <div className="contents" key={step.number}>
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black ${
                              step.complete
                                ? 'bg-vale-green text-white'
                                : index === 1
                                  ? 'bg-vale-violet text-white'
                                  : 'bg-vale-canvas text-vale-muted ring-1 ring-vale-line'
                            }`}
                          >
                            {step.complete ? (
                              <Icon icon={faCheck} />
                            ) : (
                              step.number
                            )}
                          </span>
                          <span className="hidden text-xs font-extrabold text-vale-muted sm:inline">
                            {step.label}
                          </span>
                        </div>
                        {index < 2 ? (
                          <span className="h-px min-w-3 flex-1 bg-vale-line" />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-vale-violet">
                        Exemplo visual
                      </span>
                      <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                        Crie sua conta
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-vale-muted">
                        Campos essenciais agora. O restante vem no onboarding.
                      </p>
                    </div>
                    <Badge tone="neutral">Não envia dados</Badge>
                  </div>

                  <form
                    action="/laboratorio-ui#cadastro"
                    className="mt-8 grid gap-5"
                    method="get"
                  >
                    <fieldset>
                      <legend className="mb-3 text-sm font-extrabold">
                        Quero usar o Vale como:
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <RadioCard
                          defaultChecked
                          description="Buscar vagas e oferecer serviços."
                          name="perfil"
                          value="candidate"
                          label="Pessoa candidata"
                        >
                          <Icon className="text-vale-action" icon={faUser} />
                        </RadioCard>
                        <RadioCard
                          description="Publicar vagas e contratar talentos."
                          name="perfil"
                          value="employer"
                          label="Contratante"
                        >
                          <Icon className="text-vale-muted" icon={faBuilding} />
                        </RadioCard>
                      </div>
                    </fieldset>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField label="Nome de exibição">
                        <TextInput
                          leadingIcon={<Icon icon={faUser} />}
                          name="nome"
                          placeholder="Como devemos chamar você?"
                          type="text"
                        />
                      </FormField>
                      <FormField label="E-mail">
                        <TextInput
                          leadingIcon={<Icon icon={faEnvelope} />}
                          name="email"
                          placeholder="voce@exemplo.com"
                          type="email"
                        />
                      </FormField>
                    </div>

                    <CheckboxField
                      label={
                        <>
                          Li e aceito os{' '}
                          <span className="font-bold text-vale-action">
                            Termos de Uso
                          </span>{' '}
                          e a{' '}
                          <span className="font-bold text-vale-action">
                            Política de Privacidade
                          </span>
                          .
                        </>
                      }
                      name="termos"
                    />

                    <Button fullWidth size="lg">
                      Continuar cadastro
                      <Icon icon={faArrowRight} />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <section
            className="scroll-mt-24 border-b border-vale-line bg-white/45 px-5 py-16 lg:px-12 lg:py-20"
            id="produto"
          >
            <PageHeading
              className="mb-8"
              description="A mesma base precisa funcionar para quem busca uma oportunidade, para quem presta um serviço e para organizações contratantes."
              eyebrow="04 · Produto"
              title="Do encontro à contratação."
            />

            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <article className="rounded-3xl border border-vale-line bg-white p-6 shadow-[0_18px_50px_rgba(33,26,53,0.06)] sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-vale-soft text-xl text-vale-violet">
                      <Icon icon={faGlobe} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold">Orbit Tecnologia</p>
                        <Icon
                          className="text-xs text-vale-green"
                          icon={faCircleCheck}
                        />
                      </div>
                      <p className="mt-1 text-sm text-vale-muted">
                        Tecnologia · Empresa verificada
                      </p>
                    </div>
                  </div>
                  <IconButton
                    label="Salvar vaga de Pessoa Desenvolvedora Front-end"
                    variant="secondary"
                  >
                    <Icon icon={faBookmark} />
                  </IconButton>
                </div>

                <h3 className="mt-7 text-2xl font-black tracking-[-0.04em]">
                  Pessoa Desenvolvedora Front-end
                </h3>
                <p className="mt-3 max-w-2xl leading-7 text-vale-muted">
                  Crie experiências acessíveis em React e ajude a evoluir um
                  produto usado por milhares de pequenos negócios.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge tone="info">Remoto</Badge>
                  <Badge tone="accent">Pleno</Badge>
                  <Badge tone="success">CLT</Badge>
                </div>

                <div className="mt-7 grid gap-3 border-t border-vale-line pt-6 text-sm font-semibold text-vale-muted sm:grid-cols-3">
                  <span className="flex items-center gap-2">
                    <Icon className="text-vale-violet" icon={faLocationDot} />
                    Brasil
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon className="text-vale-violet" icon={faBriefcase} />
                    R$ 7 mil–9 mil
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon className="text-vale-violet" icon={faClock} />
                    Há 2 dias
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-vale-muted">
                    Faixa salarial publicada pela empresa
                  </p>
                  <Button>
                    Ver oportunidade
                    <Icon icon={faArrowRight} />
                  </Button>
                </div>
              </article>

              <article className="rounded-3xl bg-vale-ink p-6 text-white sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-vale-yellow">
                      Seu perfil
                    </span>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                      Mais perto de novas conexões
                    </h3>
                  </div>
                  <div className="grid size-12 place-items-center rounded-2xl bg-white/10 text-vale-yellow">
                    <Icon icon={faUser} />
                  </div>
                </div>

                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-black tracking-[-0.05em]">
                      72%
                    </span>
                    <p className="mt-1 text-xs font-semibold text-white/55">
                      do perfil completo
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white/55">
                    3 de 5 etapas
                  </span>
                </div>
                <div className="mt-4">
                  <Progress label="Perfil completo" value={72} />
                </div>

                <ul className="mt-8 grid gap-3">
                  {[
                    { label: 'Dados básicos', done: true },
                    { label: 'Experiências', done: true },
                    { label: 'Habilidades', done: true },
                    { label: 'Preferências de trabalho', done: false },
                  ].map((item) => (
                    <li
                      className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm font-bold"
                      key={item.label}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid size-6 place-items-center rounded-full text-[10px] ${
                            item.done
                              ? 'bg-vale-green text-white'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {item.done ? <Icon icon={faCheck} /> : '4'}
                        </span>
                        {item.label}
                      </span>
                      <Icon
                        className="text-xs text-white/40"
                        icon={faChevronRight}
                      />
                    </li>
                  ))}
                </ul>

                <Button className="mt-6" fullWidth variant="secondary">
                  Completar perfil
                  <Icon icon={faArrowRight} />
                </Button>
              </article>
            </div>

            <div className="mt-5 rounded-3xl border border-vale-line bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-vale-soft text-vale-violet">
                    <Icon icon={faFilter} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">Filtros rápidos</h3>
                    <p className="mt-1 text-xs text-vale-muted">
                      Controles legíveis também em telas pequenas
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Design', 'Remoto', 'Freelance', 'Últimos 7 dias'].map(
                    (filter) => (
                      <button
                        className="min-h-10 rounded-full border border-vale-line bg-vale-canvas px-4 text-xs font-extrabold text-vale-muted transition hover:border-vale-violet hover:text-vale-violet focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-vale-blue"
                        key={filter}
                        type="button"
                      >
                        {filter}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>

          <section
            className="scroll-mt-24 border-b border-vale-line px-5 py-16 lg:px-12 lg:py-20"
            id="estados"
          >
            <PageHeading
              className="mb-8"
              description="Toda jornada crítica precisa prever sucesso, atenção, erro, carregamento e vazio. Texto e ícone explicam o estado; a cor apenas reforça."
              eyebrow="05 · Estados"
              title="Nada fica sem resposta."
            />

            <div className="grid gap-4 xl:grid-cols-3">
              <Alert
                icon={<Icon icon={faCircleCheck} />}
                title="Candidatura enviada"
                tone="success"
              >
                Você pode acompanhar as atualizações em “Candidaturas”.
              </Alert>
              <Alert
                icon={<Icon icon={faCircleExclamation} />}
                title="Perfil quase completo"
                tone="warning"
              >
                Adicione suas habilidades para melhorar as recomendações.
              </Alert>
              <Alert
                icon={<Icon icon={faInfoCircle} />}
                title="Sua privacidade"
                tone="info"
              >
                Você pode alterar a visibilidade do perfil quando quiser.
              </Alert>
            </div>

            <Card className="mt-5 p-6">
              <SpecimenLabel
                detail="market/status-badge"
                title="Estados de oportunidade"
              />
              <p className="max-w-2xl text-sm leading-6 text-vale-muted">
                Os mesmos badges do mercado combinam texto e cor para comunicar
                o estado da vaga ou candidatura.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <JobStatusBadge status="pending_review" />
                <JobStatusBadge status="approved" />
                <ApplicationStatusBadge status="under_review" />
                <ApplicationStatusBadge status="shortlisted" />
              </div>
            </Card>

            <div className="mt-5">
              <EmptyState
                action={
                  <Button>
                    Explorar oportunidades
                    <Icon icon={faArrowRight} />
                  </Button>
                }
                description="Explore oportunidades alinhadas ao seu perfil e salve as que quiser ver depois."
                icon={<Icon icon={faBriefcase} />}
                title="Nenhuma candidatura por aqui — ainda"
              />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Card className="p-6">
                <SpecimenLabel detail="feedback/loading" title="Carregamento" />
                <LoadingState label="Buscando oportunidades disponíveis" />
              </Card>
              <Card className="p-6">
                <SpecimenLabel
                  detail="overlay/confirmation"
                  title="Confirmação"
                />
                <DialogExample />
              </Card>
            </div>
          </section>

          <section
            className="scroll-mt-24 px-5 py-16 lg:px-12 lg:py-20"
            id="aplicacao"
          >
            <PageHeading
              className="mb-8"
              description="A aplicação do padrão acompanha a sequência do MVP. Cada etapa só avança quando os componentes usados estiverem acessíveis, responsivos, testados e documentados."
              eyebrow="06 · Plano de aplicação"
              title="Evoluir sem perder consistência."
            />

            <ol className="grid gap-4">
              {rollout.map((item, index) => (
                <li
                  className="group grid gap-4 rounded-2xl border border-vale-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-vale-violet/40 hover:shadow-[0_16px_40px_rgba(33,26,53,0.06)] sm:grid-cols-[64px_minmax(0,1fr)_36px] sm:items-center"
                  key={item.phase}
                >
                  <span className="font-mono text-sm font-black text-vale-violet">
                    {item.phase}
                  </span>
                  <div>
                    <h3 className="font-black tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-vale-muted">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className={`hidden size-9 place-items-center rounded-full sm:grid ${
                      index === 0
                        ? 'bg-vale-violet text-white'
                        : 'bg-vale-canvas text-vale-muted'
                    }`}
                  >
                    {index === 0 ? (
                      <Icon icon={faCheck} />
                    ) : (
                      <Icon icon={faChevronRight} />
                    )}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-vale-violet to-vale-violet-deep p-6 text-white sm:flex-row sm:items-center sm:p-8">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-white/60">
                  Definição de pronto
                </span>
                <p className="mt-2 max-w-2xl text-lg font-extrabold leading-7">
                  Reutilizável, responsivo, navegável por teclado e acompanhado
                  de estado de erro, vazio e carregamento.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <Icon className="text-vale-yellow" icon={faUniversalAccess} />
                <span className="text-sm font-extrabold">
                  Acessibilidade é requisito
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-vale-line bg-white">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-5 px-5 py-8 sm:flex-row sm:items-center lg:px-8">
          <Brand />
          <p className="max-w-xl text-sm leading-6 text-vale-muted">
            Laboratório de referência para uma plataforma de trabalho mais
            plural, segura e acessível.
          </p>
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-vale-violet focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-blue"
            href="/"
          >
            Voltar ao início
            <Icon icon={faArrowRight} />
          </Link>
        </div>
      </footer>
    </PageLayout>
  );
}
