'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PrivacySummary } from '@vale/shared';

import { getPrivacySummary } from '@/lib/api';

export function PrivacyCenter() {
  const [summary, setSummary] = useState<PrivacySummary | null>(null);
  const [message, setMessage] = useState(
    'Carregando informações de privacidade…',
  );

  useEffect(() => {
    let active = true;
    getPrivacySummary()
      .then((result) => {
        if (!active) return;
        setSummary(result);
        setMessage('');
      })
      .catch((error) => {
        if (!active) return;
        setMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar esta área.',
        );
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="profile-form" aria-labelledby="privacy-heading">
      <div className="form-section-heading">
        <span>Privacidade</span>
        <div>
          <h1 id="privacy-heading">Dados e controles da conta</h1>
          <p>
            Esta área mostra os tratamentos mapeados e o estado dos controles de
            privacidade.
          </p>
        </div>
      </div>
      {message ? <p role="status">{message}</p> : null}
      {summary ? (
        <>
          <section className="form-section">
            <h2>Tratamentos mapeados</h2>
            <ul>
              {summary.processing.map((item) => (
                <li key={item.category}>
                  <strong>{item.category}.</strong> {item.purpose}
                </li>
              ))}
            </ul>
          </section>
          <section className="form-section">
            <h2>Seus controles</h2>
            <p>
              Você pode corrigir campos editáveis no seu perfil. Exportação,
              consentimentos opcionais e exclusão continuam indisponíveis até a
              aprovação formal das políticas aplicáveis.
            </p>
            <Link
              className="secondary-action"
              href={summary.account.correctionPath}
            >
              Corrigir dados do perfil
            </Link>
          </section>
          <p className="field-help">
            O canal assistido e os prazos operacionais serão publicados após
            aprovação do controlador e do encarregado. Esta página não promete
            exclusão imediata.
          </p>
        </>
      ) : null}
    </section>
  );
}
