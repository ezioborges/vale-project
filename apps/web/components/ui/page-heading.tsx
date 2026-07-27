import type { ElementType, ReactNode } from 'react';

import { classNames } from './class-names';

type PageHeadingProps = {
  as?: ElementType;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function PageHeading({
  as: Heading = 'h2',
  className,
  description,
  eyebrow,
  title,
}: PageHeadingProps) {
  return (
    <div className={classNames('max-w-3xl', className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-vale-action">
          {eyebrow}
        </p>
      ) : null}
      <Heading className="text-3xl font-black tracking-[-0.045em] text-vale-ink sm:text-4xl">
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-7 text-vale-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
