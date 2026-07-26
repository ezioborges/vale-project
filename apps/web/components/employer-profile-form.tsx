'use client';

import {
  employerProfileInputSchema,
  employerProfileTypes,
  type EmployerProfile,
  type EmployerProfileInput,
} from '@vale/shared';
import { FormEvent, useEffect, useState } from 'react';

import { getCurrentUser, getMyProfile, saveEmployerProfile } from '@/lib/api';
import { ProfileAssetControl } from './profile-asset-control';

const typeLabels = {
  company: 'Empresa',
  organization: 'Organização',
  individual: 'Pessoa física',
} as const;

export function EmployerProfileForm() {
  const [draft, setDraft] = useState<EmployerProfileInput>(emptyEmployer());
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [message, setMessage] = useState('Carregando perfil institucional…');
  const [isBusy, setIsBusy] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentUser(), getMyProfile()])
      .then(([user, current]) => {
        if (!active) return;
        if (current?.kind === 'employer') {
          setProfile(current);
          setDraft(toEmployerInput(current));
          setMessage('Perfil carregado.');
        } else {
          setDraft((value) => ({
            ...value,
            responsibleName: user.displayName,
            contactEmail: user.email,
          }));
          setMessage(
            'Complete os dados institucionais. A verificação é uma etapa administrativa separada.',
          );
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o perfil.',
          );
        }
      })
      .finally(() => {
        if (active) setIsBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const parsed = employerProfileInputSchema.safeParse(draft);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Revise os campos.');
      return;
    }

    setIsBusy(true);
    setMessage('Salvando perfil institucional…');
    try {
      const saved = await saveEmployerProfile(parsed.data);
      setProfile(saved);
      setDraft(toEmployerInput(saved));
      setMessage('Perfil institucional salvo.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="profile-workspace">
      <aside className="profile-overview employer-overview">
        <span className="eyebrow">Perfil contratante</span>
        <h1>Construa confiança antes da primeira vaga</h1>
        <p>
          Apresente a organização e a pessoa responsável. Documentos fiscais não
          são coletados nesta fase.
        </p>
        <div className="completion-card">
          <div>
            <strong>{profile?.completionPercentage ?? 0}%</strong>
            <span>do perfil completo</span>
          </div>
          <progress
            aria-label="Conclusão do perfil"
            max="100"
            value={profile?.completionPercentage ?? 0}
          />
        </div>
        <div
          className={`verification-card ${
            profile?.isVerified ? 'verified' : ''
          }`}
        >
          <span>{profile?.isVerified ? 'Verificado' : 'Não verificado'}</span>
          <p>
            {profile?.isVerified
              ? 'A validação institucional está ativa.'
              : 'A futura equipe administrativa fará a validação. O próprio contratante não pode alterar este estado.'}
          </p>
        </div>
      </aside>

      <form className="profile-form" onSubmit={save}>
        <section className="form-section">
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>Identificação</h2>
              <p>Defina como você atua na plataforma.</p>
            </div>
          </div>
          <fieldset className="choice-group">
            <legend>Tipo de contratante</legend>
            <div className="choice-grid">
              {employerProfileTypes.map((type) => (
                <label className="checkbox-card" key={type}>
                  <input
                    checked={draft.type === type}
                    disabled={isBusy}
                    name="employer-type"
                    onChange={() => setDraft({ ...draft, type })}
                    type="radio"
                  />
                  {typeLabels[type]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field-grid">
            <label>
              Pessoa responsável
              <input
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, responsibleName: event.target.value })
                }
                required
                value={draft.responsibleName}
              />
            </label>
            <label>
              E-mail de contato
              <input
                disabled={isBusy}
                maxLength={254}
                onChange={(event) =>
                  setDraft({ ...draft, contactEmail: event.target.value })
                }
                required
                type="email"
                value={draft.contactEmail}
              />
            </label>
            <label>
              Telefone <span className="optional-mark">Opcional</span>
              <input
                disabled={isBusy}
                maxLength={30}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    contactPhone: nullable(event.target.value),
                  })
                }
                value={draft.contactPhone ?? ''}
              />
            </label>
            <label>
              Nome da organização
              <input
                disabled={isBusy}
                maxLength={160}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    organizationName: nullable(event.target.value),
                  })
                }
                required={draft.type !== 'individual'}
                value={draft.organizationName ?? ''}
              />
              <span className="field-help">
                Opcional somente para pessoa física.
              </span>
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>02</span>
            <div>
              <h2>Contexto institucional</h2>
              <p>Ajude pessoas candidatas a entender quem está contratando.</p>
            </div>
          </div>
          <div className="field-grid">
            <label>
              Segmento <span className="optional-mark">Opcional</span>
              <input
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    segment: nullable(event.target.value),
                  })
                }
                placeholder="Ex.: Tecnologia"
                value={draft.segment ?? ''}
              />
            </label>
            <label>
              Localidade <span className="optional-mark">Opcional</span>
              <input
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    location: nullable(event.target.value),
                  })
                }
                placeholder="Cidade, estado ou remoto"
                value={draft.location ?? ''}
              />
            </label>
            <label className="field-span">
              Site <span className="optional-mark">Opcional</span>
              <input
                disabled={isBusy}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    website: nullable(event.target.value),
                  })
                }
                placeholder="https://"
                type="url"
                value={draft.website ?? ''}
              />
            </label>
            <label className="field-span">
              Descrição institucional{' '}
              <span className="optional-mark">Opcional</span>
              <textarea
                disabled={isBusy}
                maxLength={2000}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    description: nullable(event.target.value),
                  })
                }
                rows={7}
                value={draft.description ?? ''}
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>03</span>
            <div>
              <h2>Imagem institucional</h2>
              <p>Salve o perfil antes do primeiro envio.</p>
            </div>
          </div>
          {profile ? (
            <ProfileAssetControl
              accept="image/jpeg,image/png,image/webp"
              asset={profile.logo}
              help="JPEG, PNG ou WebP, até 2 MB."
              kind="logo"
              label="Logo ou imagem institucional"
              onChange={(logo) => setProfile({ ...profile, logo })}
            />
          ) : (
            <p className="empty-state">
              O controle de imagem aparece depois que o perfil for salvo.
            </p>
          )}
        </section>

        <div className="form-footer">
          <p className="profile-message" role="status">
            {message}
          </p>
          <button className="primary-action" disabled={isBusy} type="submit">
            {isBusy ? 'Aguarde…' : 'Salvar perfil institucional'}
          </button>
        </div>
      </form>
    </div>
  );
}

function emptyEmployer(): EmployerProfileInput {
  return {
    type: 'company',
    responsibleName: '',
    contactEmail: '',
    contactPhone: null,
    organizationName: null,
    segment: null,
    description: null,
    website: null,
    location: null,
  };
}

function toEmployerInput(profile: EmployerProfile): EmployerProfileInput {
  return {
    type: profile.type,
    responsibleName: profile.responsibleName,
    contactEmail: profile.contactEmail,
    contactPhone: profile.contactPhone,
    organizationName: profile.organizationName,
    segment: profile.segment,
    description: profile.description,
    website: profile.website,
    location: profile.location,
  };
}

function nullable(value: string): string | null {
  return value.trim() ? value : null;
}
