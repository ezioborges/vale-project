import type { SVGProps } from 'react';

export function PrismaticSeedMark({
  className,
  inverse = false,
  ...props
}: SVGProps<SVGSVGElement> & { inverse?: boolean }) {
  const shell = inverse ? '#ffffff' : '#082743';
  const center = inverse ? '#082743' : '#ffffff';
  const colors = inverse
    ? ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']
    : ['#d80b2f', '#f27900', '#ffc000', '#3b812d', '#087fc0', '#66369b'];

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 64 76"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M32 1.5C16.3 8.5 5 25 5 42.2c0 16.6 10.5 26.1 24.8 29.3L32 72l2.2-.5C48.5 68.3 59 58.8 59 42.2 59 25 47.7 8.5 32 1.5Z"
        fill={shell}
      />
      <path
        d="M32 8C20 14.5 11.5 28 11.5 42c0 12.5 7.4 20.4 17.8 23.5l2.7.8 2.7-.8C45.1 62.4 52.5 54.5 52.5 42 52.5 28 44 14.5 32 8Z"
        fill={center}
      />
      <path
        d="M29.7 11.8c-4 3.2-7.2 7.1-9.6 11.4l8.2 7.3 1.4 7.5V11.8Z"
        fill={colors[0]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M34.3 11.8c4 3.2 7.2 7.1 9.6 11.4l-8.2 7.3-1.4 7.5V11.8Z"
        fill={colors[0]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M19.1 23.9a37 37 0 0 0-4.4 9.7l11.7 5.1 1.8-7-9.1-7.8Z"
        fill={colors[1]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M44.9 23.9a37 37 0 0 1 4.4 9.7l-11.7 5.1-1.8-7 9.1-7.8Z"
        fill={colors[1]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m14.4 34.4-1.7 9.4 12.5 2.5.9-6.5-11.7-5.4Z"
        fill={colors[2]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m49.6 34.4 1.7 9.4-12.5 2.5-.9-6.5 11.7-5.4Z"
        fill={colors[2]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m12.8 44.7 2.2 9.1 11.1-1.5-1-5-12.3-2.6Z"
        fill={colors[3]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m51.2 44.7-2.2 9.1-11.1-1.5 1-5 12.3-2.6Z"
        fill={colors[3]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m15.3 54.5 5.2 6.5 8-3.7-2-4.2-11.2 1.4Z"
        fill={colors[4]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m48.7 54.5-5.2 6.5-8-3.7 2-4.2 11.2 1.4Z"
        fill={colors[4]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m21.4 61.5 8.7 3.7.5-10.3-2.1 2.8-7.1 3.8Z"
        fill={colors[5]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m42.6 61.5-8.7 3.7-.5-10.3 2.1 2.8 7.1 3.8Z"
        fill={colors[5]}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M32 32.8c-2.1 5-5.4 10.6-5.4 14.1a5.4 5.4 0 0 0 10.8 0c0-3.5-3.3-9.1-5.4-14.1Z"
        fill={shell}
        stroke={center}
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3.5">
      <PrismaticSeedMark
        className="h-11 w-auto shrink-0 drop-shadow-[0_8px_14px_rgba(8,39,67,0.18)]"
        inverse={inverse}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`prismatic-wordmark text-[1.35rem] font-bold tracking-[-0.045em] ${
            inverse ? 'text-white' : 'text-vale-ink'
          }`}
        >
          primícias
        </span>
        <span
          className={`mt-1.5 text-[8px] font-extrabold uppercase tracking-[0.24em] ${
            inverse ? 'text-white/60' : 'text-vale-muted'
          }`}
        >
          talento que floresce
        </span>
      </span>
    </span>
  );
}
