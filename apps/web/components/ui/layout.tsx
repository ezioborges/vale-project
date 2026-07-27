import type { ReactNode } from 'react';

import { classNames } from './class-names';

type LayoutKind = 'public' | 'authenticated' | 'administrative';

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
  kind?: LayoutKind;
};

const kindClasses: Record<LayoutKind, string> = {
  public: 'bg-vale-canvas',
  authenticated: 'bg-vale-canvas',
  administrative: 'bg-vale-admin-canvas',
};

/** Estrutura de página para áreas públicas, autenticadas e administrativas. */
export function PageLayout({
  children,
  className,
  kind = 'public',
}: PageLayoutProps) {
  return (
    <main
      className={classNames(
        'min-h-screen text-vale-ink',
        kindClasses[kind],
        className,
      )}
      data-layout={kind}
    >
      {children}
    </main>
  );
}

type ContainerProps = {
  children: ReactNode;
  className?: string;
  size?: 'content' | 'wide';
};

export function Container({
  children,
  className,
  size = 'content',
}: ContainerProps) {
  return (
    <div
      className={classNames(
        'mx-auto w-full px-5 sm:px-6 lg:px-8',
        size === 'wide' ? 'max-w-vale-wide' : 'max-w-vale-content',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageSection({
  children,
  className,
}: Omit<ContainerProps, 'size'>) {
  return (
    <section
      className={classNames(
        'border-b border-vale-border py-16 lg:py-20',
        className,
      )}
    >
      <Container size="wide">{children}</Container>
    </section>
  );
}
