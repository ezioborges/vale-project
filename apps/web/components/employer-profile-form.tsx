'use client';

import {
  employerProfileInputSchema,
  employerProfileTypes,
  type EmployerProfile,
  type EmployerProfileInput,
} from '@vale/shared';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { getCurrentUser, getMyProfile, saveEmployerProfile } from '@/lib/api';

import { ProfileAssetControl } from './profile-asset-control';
import {
  ProfileEditorLayout,
  ProfileIntro,
  ProfileSaveBar,
  ProfileSection,
} from './profile-editor-layout';
import { Alert, LoadingState } from './ui/feedback';
import { FormField, RadioCard, TextArea, TextInput } from './ui/form-field';
import { Badge } from './ui/badge';

const typeLabels = {
  company: 'Empresa',
  organization: 'Organização',
  individual: 'Pessoa física',
} as const;

const typeDescriptions = {
  company: 'Para uma empresa que contrata.',
  organization: 'Para coletivos e organizações.',
  individual: 'Para quem contrata em nome próprio.',
} as const;

export function EmployerProfileForm() {
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<EmployerProfileInput>(emptyEmployer());
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [message, setMessage] = useState('Carregando perfil institucional…');
  const [isBusy, setIsBusy] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    Promise.all([getCurrentUser(), getMyProfile()])
      .then(([user, current]) => {
        if (!active) return;
        if (current?.kind === 'employer') {
          setProfile(current);
          setDraft(toEmployerInput(current));
          setMessage('Perfil institucional carregado.');
          return;
        }
        setDraft((value) => ({
          ...value,
          responsibleName: user.displayName,
          contactEmail: user.email,
        }));
        setMessage(
          'Complete o essencial. A verificação institucional é uma etapa administrativa separada.',
        );
      })
      .catch((error) => {
        if (!active) return;
        setMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o perfil.',
        );
      })
      .finally(() => {
        if (active) setIsBusy(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = employerProfileInputSchema.safeParse(draft);
    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error.issues);
      setFieldErrors(errors);
      setMessage('Revise os campos destacados antes de salvar.');
      requestAnimationFrame(() => feedbackRef.current?.focus());
      return;
    }

    setFieldErrors({});
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
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } finally {
      setIsBusy(false);
    }
  }

  if (isBusy && message === 'Carregando perfil institucional…') {
    return <LoadingState label="Carregando perfil institucional" />;
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return (
    <ProfileEditorLayout
      aside={
        <ProfileIntro
          completion={profile?.completionPercentage ?? 0}
          description="Apresente a organização e a pessoa responsável. Não coletamos documentos fiscais nesta etapa."
          eyebrow="Perfil contratante"
          title="Construa confiança antes da primeira vaga"
        >
          <div className="rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4">
            <Badge tone={profile?.isVerified ? 'success' : 'warning'}>
              {profile?.isVerified
                ? 'Verificação institucional ativa'
                : 'Verificação institucional pendente'}
            </Badge>
            <p className="mt-3 text-sm leading-6 text-vale-muted">
              {profile?.isVerified
                ? 'A validação institucional está ativa.'
                : 'A equipe administrativa realizará a análise. Este estado não pode ser alterado por aqui.'}
            </p>
          </div>
        </ProfileIntro>
      }
    >
      <form className="grid gap-6" noValidate onSubmit={save}>
        <div ref={feedbackRef} tabIndex={-1}>
          <Alert
            title={hasFieldErrors ? 'Revise o perfil' : 'Estado do salvamento'}
            tone={hasFieldErrors ? 'danger' : 'info'}
          >
            {message}
          </Alert>
        </div>

        <ProfileSection
          description="Defina quem está contratando e como entrar em contato."
          index={1}
          title="Identificação"
        >
          <fieldset disabled={isBusy}>
            <legend className="text-sm font-extrabold text-vale-ink">
              Tipo de contratante
            </legend>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {employerProfileTypes.map((type) => (
                <RadioCard
                  checked={draft.type === type}
                  description={typeDescriptions[type]}
                  key={type}
                  label={typeLabels[type]}
                  name="employer-type"
                  onChange={() => setDraft({ ...draft, type })}
                  value={type}
                />
              ))}
            </div>
          </fieldset>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              error={fieldErrors.responsibleName}
              id="responsible-name"
              label="Pessoa responsável"
              required
            >
              <TextInput
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, responsibleName: event.target.value })
                }
                required
                value={draft.responsibleName}
              />
            </FormField>
            <FormField
              error={fieldErrors.contactEmail}
              id="contact-email"
              label="E-mail de contato"
              required
            >
              <TextInput
                disabled={isBusy}
                maxLength={254}
                onChange={(event) =>
                  setDraft({ ...draft, contactEmail: event.target.value })
                }
                required
                type="email"
                value={draft.contactEmail}
              />
            </FormField>
            <FormField
              error={fieldErrors.contactPhone}
              id="contact-phone"
              label={optionalLabel('Telefone')}
            >
              <TextInput
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
            </FormField>
            <FormField
              error={fieldErrors.organizationName}
              hint="Obrigatório para empresa ou organização."
              id="organization-name"
              label="Nome da organização"
              required={draft.type !== 'individual'}
            >
              <TextInput
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
            </FormField>
          </div>
        </ProfileSection>

        <ProfileSection
          description="Ajude pessoas candidatas a entender a oportunidade e sua origem."
          index={2}
          title="Contexto institucional"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              error={fieldErrors.segment}
              id="segment"
              label={optionalLabel('Segmento')}
            >
              <TextInput
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, segment: nullable(event.target.value) })
                }
                placeholder="Ex.: Tecnologia"
                value={draft.segment ?? ''}
              />
            </FormField>
            <FormField
              error={fieldErrors.location}
              id="employer-location"
              label={optionalLabel('Localidade')}
            >
              <TextInput
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, location: nullable(event.target.value) })
                }
                placeholder="Cidade, estado ou remoto"
                value={draft.location ?? ''}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              error={fieldErrors.website}
              id="website"
              label={optionalLabel('Site')}
            >
              <TextInput
                disabled={isBusy}
                onChange={(event) =>
                  setDraft({ ...draft, website: nullable(event.target.value) })
                }
                placeholder="https://"
                type="url"
                value={draft.website ?? ''}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              error={fieldErrors.description}
              id="institutional-description"
              label={optionalLabel('Descrição institucional')}
            >
              <TextArea
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
            </FormField>
          </div>
        </ProfileSection>

        <ProfileSection
          description="Arquivos são privados e só podem ser baixados após nova autorização da API."
          index={3}
          title="Imagem institucional"
        >
          {profile ? (
            <ProfileAssetControl
              accept="image/jpeg,image/png,image/webp"
              asset={profile.logo}
              help="JPEG, PNG ou WebP, até 2 MB. Salvar uma nova imagem substitui a versão atual."
              kind="logo"
              label="Logo ou imagem institucional"
              onChange={(logo) => setProfile({ ...profile, logo })}
            />
          ) : (
            <Alert title="Salve antes de enviar" tone="info">
              O controle de imagem aparece depois que o perfil for salvo pela
              primeira vez.
            </Alert>
          )}
        </ProfileSection>

        <ProfileSaveBar
          isSaving={isBusy}
          message={message}
          submitLabel="Salvar perfil institucional"
        />
      </form>
    </ProfileEditorLayout>
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

function optionalLabel(label: string) {
  return (
    <>
      {label}{' '}
      <span className="font-semibold text-vale-muted">(opcional)</span>
    </>
  );
}

function toFieldErrors(
  issues: Array<{ message: string; path: PropertyKey[] }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = issue.message;
  }
  return errors;
}
