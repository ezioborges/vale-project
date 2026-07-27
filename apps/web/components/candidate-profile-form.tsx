'use client';

import {
  candidateProfileInputSchema,
  contractTypes,
  profileVisibilities,
  workModes,
  type CandidateProfile,
  type CandidateProfileInput,
  type ContractType,
  type ProfileVisibility,
  type WorkMode,
} from '@vale/shared';
import { FormEvent, useEffect, useRef, useState } from 'react';

import {
  getCurrentUser,
  getMyProfile,
  saveCandidateProfile,
  updateCandidateActivation,
  updateCandidateVisibility,
} from '@/lib/api';

import { ProfileAssetControl } from './profile-asset-control';
import {
  ProfileEditorLayout,
  ProfileIntro,
  ProfileSaveBar,
  ProfileSection,
} from './profile-editor-layout';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, LoadingState } from './ui/feedback';
import {
  CheckboxField,
  FormField,
  RadioCard,
  TextArea,
  TextInput,
} from './ui/form-field';

const workModeLabels: Record<WorkMode, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
};

const contractLabels: Record<ContractType, string> = {
  clt: 'CLT',
  pj: 'PJ',
  internship: 'Estágio',
  temporary: 'Temporário',
  freelance: 'Freelance',
  other: 'Outro',
};

const visibilityCopy: Record<
  ProfileVisibility,
  { label: string; description: string; preview: string }
> = {
  private: {
    label: 'Privado',
    description: 'Seu perfil não fica disponível para contratantes.',
    preview:
      'Somente você e a equipe autorizada do Vale podem acessar seus dados profissionais.',
  },
  applications_only: {
    label: 'Apenas candidaturas',
    description:
      'O acesso é liberado somente na relação criada por uma candidatura.',
    preview:
      'O contratante responsável por uma vaga recebe acesso apenas enquanto houver uma candidatura sua elegível para essa vaga.',
  },
  verified_employers: {
    label: 'Contratantes verificados',
    description: 'Seu perfil completo pode ser visto por organizações validadas.',
    preview:
      'Apenas contratantes institucionalmente verificados podem acessar seu perfil completo. Um perfil inativo não fica disponível.',
  },
};

export function CandidateProfileForm() {
  const feedbackRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<CandidateProfileInput>(emptyCandidate());
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [message, setMessage] = useState('Carregando seu perfil…');
  const [isBusy, setIsBusy] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    Promise.all([getCurrentUser(), getMyProfile()])
      .then(([user, current]) => {
        if (!active) return;
        if (current?.kind === 'candidate') {
          setProfile(current);
          setDraft(toCandidateInput(current));
          setMessage('Perfil carregado.');
          return;
        }
        setDraft((value) => ({ ...value, displayName: user.displayName }));
        setMessage(
          'Comece com o essencial. Seu perfil nasce privado e você decide quando ampliar o acesso.',
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
    const parsed = candidateProfileInputSchema.safeParse(draft);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      setMessage('Revise os campos destacados antes de salvar.');
      focusFirstError();
      return;
    }

    setFieldErrors({});
    setIsBusy(true);
    setMessage('Salvando perfil…');
    try {
      const saved = await saveCandidateProfile(parsed.data);
      setProfile(saved);
      setDraft(toCandidateInput(saved));
      setMessage('Perfil salvo. Alterações sensíveis foram registradas.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } finally {
      setIsBusy(false);
    }
  }

  async function changeVisibility(visibility: ProfileVisibility) {
    if (!profile) return;
    setIsBusy(true);
    setMessage('Atualizando a visibilidade…');
    try {
      const saved = await updateCandidateVisibility(visibility);
      setProfile(saved);
      setMessage(`Visibilidade atualizada para ${visibilityCopy[visibility].label}.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a privacidade.',
      );
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } finally {
      setIsBusy(false);
    }
  }

  async function changeActivation(isActive: boolean) {
    if (!profile) return;
    setIsBusy(true);
    setMessage(isActive ? 'Reativando perfil…' : 'Desativando perfil…');
    try {
      const saved = await updateCandidateActivation(isActive);
      setProfile(saved);
      setMessage(
        isActive
          ? 'Perfil reativado com a mesma regra de privacidade.'
          : 'Perfil desativado. Contratantes não podem mais acessar sua trajetória.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar a ativação.',
      );
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } finally {
      setIsBusy(false);
    }
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      const invalid = formRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      (invalid ?? feedbackRef.current)?.focus();
    });
  }

  function toggleWorkMode(mode: WorkMode) {
    setDraft((current) => ({
      ...current,
      workPreferences: {
        ...current.workPreferences,
        workModes: toggle(current.workPreferences.workModes, mode),
      },
    }));
  }

  function toggleContract(type: ContractType) {
    setDraft((current) => ({
      ...current,
      workPreferences: {
        ...current.workPreferences,
        contractTypes: toggle(current.workPreferences.contractTypes, type),
      },
    }));
  }

  if (isBusy && message === 'Carregando seu perfil…') {
    return <LoadingState label="Carregando seu perfil" />;
  }

  const selectedVisibility = profile?.visibility ?? 'private';

  return (
    <ProfileEditorLayout
      aside={
        <ProfileIntro
          completion={profile?.completionPercentage ?? 0}
          description="Pronomes são opcionais. O Vale não pede orientação sexual nem identidade de gênero para liberar oportunidades."
          eyebrow="Perfil profissional"
          title="Apresente sua trajetória do seu jeito"
        >
          <Alert title="Privacidade por padrão" tone="info">
            Um perfil novo começa privado. Arquivos nunca ficam em uma pasta
            pública e cada download passa novamente pela autorização.
          </Alert>
        </ProfileIntro>
      }
    >
      <form className="grid gap-6" noValidate onSubmit={save} ref={formRef}>
        <div ref={feedbackRef} tabIndex={-1}>
          <Alert
            title={Object.keys(fieldErrors).length ? 'Revise o perfil' : 'Estado do salvamento'}
            tone={Object.keys(fieldErrors).length ? 'danger' : 'info'}
          >
            {message}
          </Alert>
        </div>

        <ProfileSection
          description="Informações que ajudam a contextualizar seu trabalho."
          index={1}
          title="Apresentação"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              error={fieldErrors.displayName}
              hint="Pode ser seu nome social ou profissional."
              id="display-name"
              label="Nome de exibição"
              required
            >
              <TextInput
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, displayName: event.target.value })
                }
                required
                value={draft.displayName}
              />
            </FormField>
            <FormField
              error={fieldErrors.pronouns}
              id="pronouns"
              label={optionalLabel('Pronomes')}
            >
              <TextInput
                disabled={isBusy}
                maxLength={60}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    pronouns: nullable(event.target.value),
                  })
                }
                value={draft.pronouns ?? ''}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              error={fieldErrors.headline}
              id="headline"
              label={optionalLabel('Título profissional')}
            >
              <TextInput
                disabled={isBusy}
                maxLength={140}
                onChange={(event) =>
                  setDraft({ ...draft, headline: nullable(event.target.value) })
                }
                placeholder="Ex.: Desenvolvedora backend"
                value={draft.headline ?? ''}
              />
            </FormField>
            <FormField
              error={fieldErrors.location}
              id="candidate-location"
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
              error={fieldErrors['workPreferences.availability']}
              id="availability"
              label={optionalLabel('Disponibilidade')}
            >
              <TextInput
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    workPreferences: {
                      ...draft.workPreferences,
                      availability: nullable(event.target.value),
                    },
                  })
                }
                placeholder="Ex.: Imediata"
                value={draft.workPreferences.availability ?? ''}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              error={fieldErrors.bio}
              id="bio"
              label={optionalLabel('Bio profissional')}
            >
              <TextArea
                disabled={isBusy}
                maxLength={2000}
                onChange={(event) =>
                  setDraft({ ...draft, bio: nullable(event.target.value) })
                }
                rows={5}
                value={draft.bio ?? ''}
              />
            </FormField>
          </div>
        </ProfileSection>

        <ProfileSection
          description="Preferências estruturadas ajudam os filtros sem expor dados além do necessário."
          index={2}
          title="Preferências e habilidades"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              error={fieldErrors['workPreferences.areas']}
              hint="Separe as áreas por vírgula."
              id="areas"
              label="Áreas de interesse"
            >
              <TextInput
                disabled={isBusy}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    workPreferences: {
                      ...draft.workPreferences,
                      areas: splitList(event.target.value),
                    },
                  })
                }
                placeholder="Tecnologia, Produto, Dados"
                value={draft.workPreferences.areas.join(', ')}
              />
            </FormField>
            <FormField
              error={fieldErrors.skills}
              hint="Separe as habilidades por vírgula."
              id="skills"
              label="Habilidades"
            >
              <TextInput
                disabled={isBusy}
                onChange={(event) =>
                  setDraft({ ...draft, skills: splitList(event.target.value) })
                }
                placeholder="NestJS, PostgreSQL, UX"
                value={draft.skills.join(', ')}
              />
            </FormField>
          </div>
          <fieldset className="mt-6" disabled={isBusy}>
            <legend className="text-sm font-extrabold text-vale-ink">
              Modalidade desejada
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {workModes.map((mode) => (
                <label
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-vale-md border border-vale-border bg-vale-surface px-4 text-sm font-bold text-vale-ink transition hover:border-vale-action has-[:checked]:border-2 has-[:checked]:border-vale-action has-[:checked]:bg-vale-action-subtle"
                  key={mode}
                >
                  <input
                    checked={draft.workPreferences.workModes.includes(mode)}
                    className="size-4 accent-vale-action"
                    onChange={() => toggleWorkMode(mode)}
                    type="checkbox"
                  />
                  {workModeLabels[mode]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-6" disabled={isBusy}>
            <legend className="text-sm font-extrabold text-vale-ink">
              Regime de trabalho
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {contractTypes.map((type) => (
                <label
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-vale-md border border-vale-border bg-vale-surface px-4 text-sm font-bold text-vale-ink transition hover:border-vale-action has-[:checked]:border-2 has-[:checked]:border-vale-action has-[:checked]:bg-vale-action-subtle"
                  key={type}
                >
                  <input
                    checked={draft.workPreferences.contractTypes.includes(type)}
                    className="size-4 accent-vale-action"
                    onChange={() => toggleContract(type)}
                    type="checkbox"
                  />
                  {contractLabels[type]}
                </label>
              ))}
            </div>
          </fieldset>
        </ProfileSection>

        <ProfileSection
          description="Adicione até 15 experiências profissionais."
          index={3}
          title="Experiência"
        >
          <div className="grid gap-4">
            {draft.experiences.map((experience, index) => (
              <Card className="p-5" key={`experience-${index}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-extrabold text-vale-ink">
                    Experiência {index + 1}
                  </h3>
                  <Button
                    disabled={isBusy}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        experiences: draft.experiences.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                    size="sm"
                    variant="ghost"
                  >
                    Remover
                  </Button>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <FormField
                    error={fieldErrors[`experiences.${index}.title`]}
                    id={`experience-${index}-title`}
                    label="Cargo"
                    required
                  >
                    <TextInput
                      disabled={isBusy}
                      onChange={(event) =>
                        updateExperience(index, {
                          title: event.target.value,
                        })
                      }
                      required
                      value={experience.title}
                    />
                  </FormField>
                  <FormField
                    error={fieldErrors[`experiences.${index}.organization`]}
                    id={`experience-${index}-organization`}
                    label="Organização"
                    required
                  >
                    <TextInput
                      disabled={isBusy}
                      onChange={(event) =>
                        updateExperience(index, {
                          organization: event.target.value,
                        })
                      }
                      required
                      value={experience.organization}
                    />
                  </FormField>
                  <FormField
                    error={fieldErrors[`experiences.${index}.startDate`]}
                    id={`experience-${index}-start`}
                    label="Início"
                    required
                  >
                    <TextInput
                      disabled={isBusy}
                      onChange={(event) =>
                        updateExperience(index, { startDate: event.target.value })
                      }
                      required
                      type="month"
                      value={experience.startDate}
                    />
                  </FormField>
                  <FormField
                    error={fieldErrors[`experiences.${index}.endDate`]}
                    id={`experience-${index}-end`}
                    label="Término"
                    required={!experience.current}
                  >
                    <TextInput
                      disabled={isBusy || experience.current}
                      onChange={(event) =>
                        updateExperience(index, {
                          endDate: nullable(event.target.value),
                        })
                      }
                      required={!experience.current}
                      type="month"
                      value={experience.endDate ?? ''}
                    />
                  </FormField>
                  <CheckboxField
                    className="md:col-span-2"
                    disabled={isBusy}
                    id={`experience-${index}-current`}
                    label="Trabalho aqui atualmente"
                    checked={experience.current}
                    onChange={(event) =>
                      updateExperience(index, {
                        current: event.target.checked,
                        endDate: event.target.checked ? null : experience.endDate,
                      })
                    }
                  />
                  <FormField
                    className="md:col-span-2"
                    error={fieldErrors[`experiences.${index}.description`]}
                    id={`experience-${index}-description`}
                    label={optionalLabel('Descrição')}
                  >
                    <TextArea
                      disabled={isBusy}
                      maxLength={1000}
                      onChange={(event) =>
                        updateExperience(index, {
                          description: nullable(event.target.value),
                        })
                      }
                      rows={3}
                      value={experience.description ?? ''}
                    />
                  </FormField>
                </div>
              </Card>
            ))}
          </div>
          <Button
            className="mt-5"
            disabled={isBusy || draft.experiences.length >= 15}
            onClick={() =>
              setDraft({
                ...draft,
                experiences: [
                  ...draft.experiences,
                  {
                    title: '',
                    organization: '',
                    startDate: new Date().toISOString().slice(0, 7),
                    endDate: null,
                    current: true,
                    description: null,
                  },
                ],
              })
            }
            variant="secondary"
          >
            Adicionar experiência
          </Button>
        </ProfileSection>

        <ProfileSection
          description="Inclua formação acadêmica e referências profissionais."
          index={4}
          title="Formação e links"
        >
          <div className="grid gap-4">
            {draft.education.map((education, index) => (
              <Card className="p-5" key={`education-${index}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-extrabold text-vale-ink">
                    Formação {index + 1}
                  </h3>
                  <Button
                    disabled={isBusy}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        education: draft.education.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                    size="sm"
                    variant="ghost"
                  >
                    Remover
                  </Button>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <FormField
                    error={fieldErrors[`education.${index}.institution`]}
                    id={`education-${index}-institution`}
                    label="Instituição"
                    required
                  >
                    <TextInput
                      disabled={isBusy}
                      onChange={(event) =>
                        updateEducation(index, {
                          institution: event.target.value,
                        })
                      }
                      required
                      value={education.institution}
                    />
                  </FormField>
                  <FormField
                    error={fieldErrors[`education.${index}.course`]}
                    id={`education-${index}-course`}
                    label="Curso"
                    required
                  >
                    <TextInput
                      disabled={isBusy}
                      onChange={(event) =>
                        updateEducation(index, { course: event.target.value })
                      }
                      required
                      value={education.course}
                    />
                  </FormField>
                  <FormField
                    error={fieldErrors[`education.${index}.level`]}
                    id={`education-${index}-level`}
                    label={optionalLabel('Nível')}
                  >
                    <TextInput
                      disabled={isBusy}
                      maxLength={80}
                      onChange={(event) =>
                        updateEducation(index, {
                          level: nullable(event.target.value),
                        })
                      }
                      value={education.level ?? ''}
                    />
                  </FormField>
                  <FormField
                    error={fieldErrors[`education.${index}.startYear`]}
                    id={`education-${index}-start-year`}
                    label={optionalLabel('Ano de início')}
                  >
                    <TextInput
                      disabled={isBusy}
                      max={2200}
                      min={1940}
                      onChange={(event) =>
                        updateEducation(index, {
                          startYear: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                      type="number"
                      value={education.startYear ?? ''}
                    />
                  </FormField>
                  <FormField
                    error={fieldErrors[`education.${index}.endYear`]}
                    id={`education-${index}-end-year`}
                    label={optionalLabel('Ano de conclusão')}
                  >
                    <TextInput
                      disabled={isBusy}
                      max={2200}
                      min={1940}
                      onChange={(event) =>
                        updateEducation(index, {
                          endYear: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                      type="number"
                      value={education.endYear ?? ''}
                    />
                  </FormField>
                </div>
              </Card>
            ))}
          </div>
          <Button
            className="mt-5"
            disabled={isBusy || draft.education.length >= 15}
            onClick={() =>
              setDraft({
                ...draft,
                education: [
                  ...draft.education,
                  {
                    institution: '',
                    course: '',
                    level: null,
                    startYear: null,
                    endYear: null,
                  },
                ],
              })
            }
            variant="secondary"
          >
            Adicionar formação
          </Button>
          <FormField
            className="mt-6"
            error={fieldErrors.professionalLinks}
            hint="Um endereço por linha, até oito links."
            id="professional-links"
            label={optionalLabel('Links profissionais')}
          >
            <TextArea
              disabled={isBusy}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  professionalLinks: event.target.value
                    .split(/\r?\n/)
                    .map((value) => value.trim())
                    .filter(Boolean),
                })
              }
              placeholder={'https://linkedin.com/in/...\nhttps://github.com/...'}
              rows={3}
              value={draft.professionalLinks.join('\n')}
            />
          </FormField>
        </ProfileSection>

        <ProfileSection
          description="O arquivo só fica disponível após uma autorização por recurso. Salve o perfil antes do primeiro envio."
          index={5}
          title="Arquivos privados"
        >
          {profile ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileAssetControl
                accept="image/jpeg,image/png,image/webp"
                asset={profile.avatar}
                help="JPEG, PNG ou WebP, até 2 MB. O nome do arquivo não é exibido fora do contexto autorizado."
                kind="avatar"
                label="Avatar"
                onChange={(avatar) => setProfile({ ...profile, avatar })}
              />
              <ProfileAssetControl
                accept="application/pdf"
                asset={profile.resume}
                help="PDF válido, até 5 MB. Uma nova versão substitui a atual."
                kind="resume"
                label="Currículo"
                onChange={(resume) => setProfile({ ...profile, resume })}
              />
            </div>
          ) : (
            <Alert title="Salve antes de enviar" tone="info">
              Os controles de arquivo aparecem depois que o perfil for salvo
              pela primeira vez.
            </Alert>
          )}
        </ProfileSection>

        <ProfileSection
          description="A escolha só muda quando você a confirma abaixo; salvar outros dados não altera sua visibilidade."
          index={6}
          title="Privacidade e ativação"
        >
          <fieldset disabled={!profile || isBusy}>
            <legend className="text-sm font-extrabold text-vale-ink">
              Quem pode acessar seu perfil
            </legend>
            <div className="mt-3 grid gap-3">
              {profileVisibilities.map((visibility) => (
                <RadioCard
                  checked={selectedVisibility === visibility}
                  description={visibilityCopy[visibility].description}
                  key={visibility}
                  label={visibilityCopy[visibility].label}
                  name="visibility"
                  onChange={() => void changeVisibility(visibility)}
                  value={visibility}
                />
              ))}
            </div>
          </fieldset>
          <div aria-live="polite" className="mt-5 rounded-vale-md border border-vale-info/25 bg-vale-info-subtle p-4">
            <h3 className="font-extrabold text-vale-info-strong">
              Prévia: {visibilityCopy[selectedVisibility].label}
            </h3>
            <p className="mt-2 text-sm leading-6 text-vale-info-strong/85">
              {visibilityCopy[selectedVisibility].preview}
            </p>
          </div>
          {!profile ? (
            <p className="mt-4 text-sm leading-6 text-vale-muted">
              Salve o perfil para poder escolher uma regra de visibilidade.
            </p>
          ) : null}
          <CheckboxField
            className="mt-6 rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4"
            checked={profile?.isActive ?? true}
            disabled={!profile || isBusy}
            hint="Desativar impede qualquer acesso de contratantes sem apagar sua trajetória, arquivos ou conta."
            id="profile-active"
            label="Perfil ativo"
            onChange={(event) => void changeActivation(event.target.checked)}
          />
          <Alert className="mt-6" title="Ações diferentes, consequências diferentes" tone="warning">
            Remover um arquivo apaga apenas aquela versão. Desativar o perfil
            interrompe o acesso de contratantes e pode ser revertido. Excluir a
            conta não está disponível nesta tela.
          </Alert>
        </ProfileSection>

        <ProfileSaveBar isSaving={isBusy} message={message} submitLabel="Salvar perfil" />
      </form>
    </ProfileEditorLayout>
  );

  function updateExperience(
    index: number,
    updates: Partial<CandidateProfileInput['experiences'][number]>,
  ) {
    setDraft((current) => ({
      ...current,
      experiences: current.experiences.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      ),
    }));
  }

  function updateEducation(
    index: number,
    updates: Partial<CandidateProfileInput['education'][number]>,
  ) {
    setDraft((current) => ({
      ...current,
      education: current.education.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      ),
    }));
  }
}

function emptyCandidate(): CandidateProfileInput {
  return {
    displayName: '',
    pronouns: null,
    headline: null,
    bio: null,
    location: null,
    workPreferences: {
      areas: [],
      workModes: [],
      contractTypes: [],
      availability: null,
    },
    skills: [],
    experiences: [],
    education: [],
    professionalLinks: [],
  };
}

function toCandidateInput(profile: CandidateProfile): CandidateProfileInput {
  return {
    displayName: profile.displayName,
    pronouns: profile.pronouns,
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    workPreferences: profile.workPreferences,
    skills: profile.skills,
    experiences: profile.experiences,
    education: profile.education,
    professionalLinks: profile.professionalLinks,
  };
}

function nullable(value: string): string | null {
  const clean = value.trim();
  return clean ? clean : null;
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
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
