import Link from 'next/link';

import { OnboardingVerification } from '@/components/onboarding-verification';

export default async function EmployerOnboarding({
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
        <OnboardingVerification role="employer" token={token} />
      </div>
    </main>
  );
}
