'use client';

import type { ReportReason, ReportTargetType } from '@vale/shared';
import { FormEvent, useState } from 'react';

import { ApiRequestError, createReport } from '@/lib/api';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert } from './ui/feedback';
import { FormField, Select, TextArea } from './ui/form-field';

const reasonLabels: Record<ReportReason, string> = {
  discrimination: 'Discriminação',
  harassment: 'Assédio ou intimidação',
  fraud: 'Fraude ou informação enganosa',
  inappropriate_content: 'Conteúdo inadequado',
  privacy: 'Privacidade ou exposição de dados',
  spam: 'Spam',
  other: 'Outro motivo',
};

export function ReportControl({
  targetType,
  targetId,
  label = 'Denunciar este conteúdo',
}: {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('inappropriate_content');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage('');
    try {
      await createReport({ targetType, targetId, reason, description });
      setSent(true);
      setMessage(
        'Denúncia registrada. A equipe verá o relato completo; você acompanhará apenas o status.',
      );
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError && error.status === 401
          ? 'Entre na sua conta para registrar uma denúncia.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível registrar a denúncia.',
      );
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="ghost">
        {label}
      </Button>
    );
  }

  return (
    <Card
      as="form"
      className="grid gap-5 border-vale-danger/25 bg-vale-danger-subtle p-5"
      onSubmit={submit}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-extrabold text-vale-ink">
            Denúncia confidencial para a equipe
          </h3>
          <p className="mt-2 text-sm leading-6 text-vale-muted">
            Descreva apenas fatos necessários. Não inclua senhas, documentos ou
            dados de outras pessoas que não sejam essenciais ao relato.
          </p>
        </div>
        {!sent ? (
          <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
            Fechar
          </Button>
        ) : null}
      </div>
      {!sent ? (
        <>
          <FormField id={`report-reason-${targetId}`} label="Motivo" required>
            <Select
              onChange={(event) =>
                setReason(event.target.value as ReportReason)
              }
              value={reason}
            >
              {Object.entries(reasonLabels).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            hint="Mínimo de 20 caracteres."
            id={`report-description-${targetId}`}
            label="O que aconteceu?"
            required
          >
            <TextArea
              disabled={sending}
              maxLength={2000}
              minLength={20}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva fatos, contexto e o trecho que precisa ser analisado."
              required
              rows={6}
              value={description}
            />
          </FormField>
          <Button
            fullWidth
            loading={sending}
            loadingLabel="Registrando denúncia"
            type="submit"
            variant="danger"
          >
            Enviar denúncia
          </Button>
        </>
      ) : null}
      {message ? (
        <Alert
          title={sent ? 'Denúncia registrada' : 'Não foi possível enviar'}
          tone={sent ? 'success' : 'danger'}
        >
          {message}
        </Alert>
      ) : null}
    </Card>
  );
}
