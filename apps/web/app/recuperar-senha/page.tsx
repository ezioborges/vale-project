import Link from 'next/link';

import { PasswordResetForm } from '@/components/password-reset-form';

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
      </header>
      <div className="onboarding-layout">
        <PasswordResetForm token={token} />
      </div>
    </main>
  );
}
