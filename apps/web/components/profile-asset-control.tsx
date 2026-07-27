'use client';

import type { ProfileAsset, ProfileAssetKind } from '@vale/shared';
import { ChangeEvent, useId, useState } from 'react';

import {
  deleteProfileFile,
  downloadProfileFile,
  uploadProfileFile,
} from '@/lib/api';

import { Button } from './ui/button';
import { Card } from './ui/card';

type ProfileAssetControlProps = {
  accept: string;
  asset: ProfileAsset | null;
  help: string;
  kind: ProfileAssetKind;
  label: string;
  onChange: (asset: ProfileAsset | null) => void;
};

/** Upload protegido: a interface só mostra metadados retornados pela API. */
export function ProfileAssetControl({
  accept,
  asset,
  help,
  kind,
  label,
  onChange,
}: ProfileAssetControlProps) {
  const inputId = useId();
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsBusy(true);
    setMessage('Enviando arquivo…');
    try {
      const uploaded = await uploadProfileFile(kind, file);
      onChange(uploaded);
      setMessage('Arquivo salvo com acesso protegido.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o arquivo.',
      );
    } finally {
      setIsBusy(false);
      event.target.value = '';
    }
  }

  async function remove() {
    if (!asset) return;

    setIsBusy(true);
    setMessage('Removendo arquivo…');
    try {
      await deleteProfileFile(asset.id);
      onChange(null);
      setMessage('Arquivo removido. Isso não desativa seu perfil.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível remover o arquivo.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function download() {
    if (!asset) return;

    setIsBusy(true);
    setMessage('Preparando download…');
    try {
      await downloadProfileFile(asset);
      setMessage('Download iniciado.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível baixar o arquivo.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h3 className="font-extrabold text-vale-ink">{label}</h3>
        <p className="mt-1 text-sm leading-6 text-vale-muted">{help}</p>
      </div>
      {asset ? (
        <>
          <p className="break-all rounded-vale-md bg-vale-neutral-subtle px-3 py-2 text-sm text-vale-muted">
            {asset.fileName} · {formatBytes(asset.sizeBytes)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={isBusy} onClick={download} variant="secondary">
              Baixar
            </Button>
            <Button disabled={isBusy} onClick={remove} variant="danger">
              Remover arquivo
            </Button>
          </div>
        </>
      ) : (
        <div>
          <input
            accept={accept}
            className="sr-only"
            disabled={isBusy}
            id={inputId}
            onChange={upload}
            type="file"
          />
          <Button
            aria-controls={inputId}
            disabled={isBusy}
            onClick={() => document.getElementById(inputId)?.click()}
            variant="secondary"
          >
            {isBusy ? 'Enviando…' : 'Selecionar arquivo'}
          </Button>
        </div>
      )}
      {message ? (
        <p aria-live="polite" className="text-sm leading-6 text-vale-muted">
          {message}
        </p>
      ) : null}
    </Card>
  );
}

function formatBytes(size: number): string {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
