import { PasswordResetForm } from '@/components/password-reset-form';
import { PublicIdentityLayout } from '@/components/identity-layout';

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <PublicIdentityLayout>
      <PasswordResetForm token={token} />
    </PublicIdentityLayout>
  );
}
