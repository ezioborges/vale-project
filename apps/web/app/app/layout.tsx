import { ReactNode } from 'react';

import { SessionBoundary } from '@/components/session-boundary';

export default function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SessionBoundary>{children}</SessionBoundary>;
}
