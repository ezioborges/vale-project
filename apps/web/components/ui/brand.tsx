import { faSeedling } from '@fortawesome/free-solid-svg-icons';

import { Icon } from './icon';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-vale-lg bg-vale-action text-white shadow-vale-action">
        <span aria-hidden="true" className="primicias-pride-bar absolute inset-x-0 bottom-0 h-1.5" />
        <Icon className="text-sm" icon={faSeedling} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`text-lg font-black tracking-[-0.04em] ${
            inverse ? 'text-white' : 'text-vale-ink'
          }`}
        >
          primícias
        </span>
        <span
          className={`mt-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
            inverse ? 'text-white/60' : 'text-vale-muted'
          }`}
        >
          talento que floresce
        </span>
      </span>
    </span>
  );
}
