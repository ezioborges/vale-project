import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { classNames } from './class-names';

type CardProps<T extends ElementType = 'article'> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function Card<T extends ElementType = 'article'>({
  as,
  children,
  className,
  ...props
}: CardProps<T>) {
  const Component = as ?? 'article';

  return (
    <Component
      className={classNames(
        'prismatic-card rounded-vale-lg border border-vale-border bg-vale-surface shadow-vale-card',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
