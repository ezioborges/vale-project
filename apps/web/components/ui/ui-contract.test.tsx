import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';
import { actionClassName, Button, IconButton } from './button';
import { Card } from './card';
import { Dialog } from './dialog';
import { FormField, TextInput } from './form-field';
import { Alert, EmptyState, Progress } from './feedback';
import { Icon } from './icon';
import { Container, PageLayout } from './layout';

describe('contratos das primitivas de interface', () => {
  it('preserva a semântica e o estado indisponível das ações', () => {
    const markup = renderToStaticMarkup(
      <>
        <Button loading type="submit">
          Salvar perfil
        </Button>
        <IconButton label="Salvar oportunidade">
          <Icon icon={faBookmark} />
        </IconButton>
      </>,
    );

    expect(markup).toContain('type="submit"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Salvar oportunidade"');
    expect(markup).toContain('title="Salvar oportunidade"');
    expect(markup).toContain('aspect-square');
    expect(actionClassName({ variant: 'secondary' })).toContain(
      'border-vale-border',
    );
    expect(actionClassName({ variant: 'ghost' })).toContain('bg-transparent');
    expect(actionClassName({ variant: 'danger' })).toContain('bg-vale-danger');
  });

  it('associa rótulo, ajuda e erro ao campo inválido', () => {
    const markup = renderToStaticMarkup(
      <FormField
        error="Informe um e-mail válido."
        hint="Usaremos este endereço para acesso à conta."
        id="email"
        label="E-mail"
        required
      >
        <TextInput type="email" />
      </FormField>,
    );

    expect(markup).toContain(
      '<label class="text-sm font-extrabold text-vale-ink" for="email">',
    );
    expect(markup).toContain('aria-describedby="email-hint email-error"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('id="email-error" role="alert"');
  });

  it('expõe feedback, vazio, progresso e diálogo com semântica acessível', () => {
    const markup = renderToStaticMarkup(
      <>
        <Badge tone="success">Perfil verificado</Badge>
        <Alert title="Alteração salva" tone="success">
          Você pode continuar quando quiser.
        </Alert>
        <EmptyState
          description="Altere os filtros ou publique uma oportunidade."
          title="Nenhuma oportunidade encontrada"
        />
        <Progress label="Perfil completo" value={72} />
        <Dialog onClose={() => undefined} open title="Confirmar remoção">
          Esta ação não pode ser desfeita.
        </Dialog>
        <PageLayout kind="administrative">
          <Container size="wide">
            <Card>Conteúdo administrativo</Card>
          </Container>
        </PageLayout>
      </>,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('Nenhuma oportunidade encontrada');
    expect(markup).toContain('<progress aria-label="Perfil completo"');
    expect(markup).toContain('<dialog aria-labelledby=');
    expect(markup).toContain('data-layout="administrative"');
    expect(markup).toContain('max-w-vale-wide');
  });
});
