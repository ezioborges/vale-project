import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeading } from '@/components/ui/page-heading';

export default function AppHome() {
  return (
    <Card className="max-w-3xl p-6 sm:p-8">
      <Badge tone="info">Sessão protegida</Badge>
      <PageHeading
        as="h1"
        className="mt-5"
        description="Esta área fica disponível somente após a validação da sessão. A API continua autorizando cada ação sensível."
        title="Conta autenticada"
      />
    </Card>
  );
}
