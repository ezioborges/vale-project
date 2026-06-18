import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Vale Project',
  description: 'Plataforma de empregabilidade segura e inclusiva.',
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
