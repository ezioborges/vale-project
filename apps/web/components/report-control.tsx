'use client';

import type { ReportReason, ReportTargetType } from '@vale/shared';
import { FormEvent, useState } from 'react';

import { ApiRequestError, createReport } from '@/lib/api';

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

  async function submit(event: FormEvent) {
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
      <button
        className="report-link"
        type="button"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <form className="report-form" onSubmit={submit}>
      <div className="editor-heading">
        <strong>Denúncia confidencial para a equipe</strong>
        {!sent && (
          <button
            className="text-action"
            type="button"
            onClick={() => setOpen(false)}
          >
            Fechar
          </button>
        )}
      </div>
      {!sent && (
        <>
          <label>
            Motivo
            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as ReportReason)
              }
            >
              {Object.entries(reasonLabels).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label>
            O que aconteceu?
            <textarea
              required
              minLength={20}
              maxLength={2000}
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva fatos, contexto e o trecho que precisa ser analisado. Não inclua senhas ou documentos."
            />
          </label>
          <button className="danger-action" disabled={sending}>
            {sending ? 'Registrando…' : 'Enviar denúncia'}
          </button>
        </>
      )}
      {message && <p className="notice">{message}</p>}
    </form>
  );
}
