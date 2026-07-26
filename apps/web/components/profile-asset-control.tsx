'use client';

import type { ProfileAsset, ProfileAssetKind } from '@vale/shared';
import { ChangeEvent, useState } from 'react';

import {
  deleteProfileFile,
  downloadProfileFile,
  uploadProfileFile,
} from '@/lib/api';

type ProfileAssetControlProps = {
  accept: string;
  asset: ProfileAsset | null;
  help: string;
  kind: ProfileAssetKind;
  label: string;
  onChange: (asset: ProfileAsset | null) => void;
};

export function ProfileAssetControl({
  accept,
  asset,
  help,
  kind,
  label,
  onChange,
}: ProfileAssetControlProps) {
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
    try {
      await deleteProfileFile(asset.id);
      onChange(null);
      setMessage('Arquivo removido.');
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
    <div className="asset-control">
      <div>
        <strong>{label}</strong>
        <p className="field-help">{help}</p>
      </div>
      {asset ? (
        <div className="asset-summary">
          <span>
            {asset.fileName} · {formatBytes(asset.sizeBytes)}
          </span>
          <div className="inline-actions">
            <button
              className="secondary-action"
              disabled={isBusy}
              onClick={download}
              type="button"
            >
              Baixar
            </button>
            <button
              className="danger-action"
              disabled={isBusy}
              onClick={remove}
              type="button"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <label className="file-picker">
          <span>Selecionar arquivo</span>
          <input
            accept={accept}
            disabled={isBusy}
            onChange={upload}
            type="file"
          />
        </label>
      )}
      {message ? (
        <p className="field-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function formatBytes(size: number): string {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
