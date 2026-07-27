import { PublicIdentityLayout } from '@/components/identity-layout';
import { OnboardingVerification } from '@/components/onboarding-verification';

export default async function CandidateOnboarding({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <PublicIdentityLayout>
      <OnboardingVerification role="candidate" token={token} />
    </PublicIdentityLayout>
  );
}
