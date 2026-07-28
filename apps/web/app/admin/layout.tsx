import { ReactNode } from 'react';

import { AuthenticatedAppFrame } from '@/components/authenticated-app-frame';
import { SessionBoundary } from '@/components/session-boundary';

export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionBoundary>
      <AuthenticatedAppFrame>{children}</AuthenticatedAppFrame>
    </SessionBoundary>
  );
}
