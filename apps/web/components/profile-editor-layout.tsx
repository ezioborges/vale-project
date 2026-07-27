import type { ReactNode } from 'react';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/feedback';
import { classNames } from './ui/class-names';
import { PageHeading } from './ui/page-heading';

type ProfileEditorLayoutProps = {
  children: ReactNode;
  aside: ReactNode;
};

/** Estrutura composta e reutilizável para os fluxos de manutenção de perfil. */
export function ProfileEditorLayout({
  aside,
  children,
}: ProfileEditorLayoutProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.8fr)] xl:items-start">
      <aside className="xl:sticky xl:top-6">{aside}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

type ProfileIntroProps = {
  children?: ReactNode;
  completion: number;
  description: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
};

export function ProfileIntro({
  children,
  completion,
  description,
  eyebrow,
  title,
}: ProfileIntroProps) {
  return (
    <Card className="grid gap-6 p-6 sm:p-8">
      <PageHeading
        as="h1"
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <Progress label="Perfil completo" value={completion} />
      {children}
    </Card>
  );
}

type ProfileSectionProps = {
  children: ReactNode;
  className?: string;
  description: ReactNode;
  index: number | string;
  title: ReactNode;
};

export function ProfileSection({
  children,
  className,
  description,
  index,
  title,
}: ProfileSectionProps) {
  return (
    <Card className={classNames('p-5 sm:p-7', className)}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-vale-action text-xs font-black text-white"
        >
          {String(index).padStart(2, '0')}
        </span>
        <div>
          <h2 className="text-xl font-black tracking-[-0.03em] text-vale-ink sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-vale-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </Card>
  );
}

type ProfileSaveBarProps = {
  isSaving: boolean;
  message: ReactNode;
  submitLabel: string;
};

export function ProfileSaveBar({
  isSaving,
  message,
  submitLabel,
}: ProfileSaveBarProps) {
  return (
    <div className="sticky bottom-4 z-10 mt-6 flex flex-col gap-4 rounded-vale-lg border border-vale-border bg-vale-surface p-4 shadow-vale-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <p aria-live="polite" className="text-sm leading-6 text-vale-muted">
        {message}
      </p>
      <Button loading={isSaving} loadingLabel="Salvando perfil" type="submit">
        {isSaving ? 'Salvando…' : submitLabel}
      </Button>
    </div>
  );
}
