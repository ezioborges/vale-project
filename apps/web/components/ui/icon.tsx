import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ComponentProps } from 'react';

type IconProps = Omit<ComponentProps<typeof FontAwesomeIcon>, 'icon'> & {
  icon: IconDefinition;
};

/**
 * Ícone decorativo por padrão. Forneça `title` quando ele próprio comunicar
 * informação que não esteja presente em texto adjacente.
 */
export function Icon({
  'aria-hidden': ariaHidden,
  fixedWidth = true,
  title,
  ...props
}: IconProps) {
  return (
    <FontAwesomeIcon
      aria-hidden={title ? ariaHidden : (ariaHidden ?? true)}
      fixedWidth={fixedWidth}
      title={title}
      {...props}
    />
  );
}
