import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import type { Metadata } from 'next';

import './globals.css';

config.autoAddCss = false;

export const metadata: Metadata = {
  title: 'Primícias',
  description: 'Talento que floresce: uma plataforma de empregabilidade segura e inclusiva.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
