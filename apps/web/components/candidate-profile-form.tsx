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
import { FormEvent, useEffect, useState } from 'react';

import {
  getCurrentUser,
  getMyProfile,
  saveCandidateProfile,
  updateCandidateActivation,
  updateCandidateVisibility,
} from '@/lib/api';
import { ProfileAssetControl } from './profile-asset-control';

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
  { label: string; description: string }
> = {
  private: {
    label: 'Privado',
    description: 'Somente você e a equipe autorizada do Vale.',
  },
  applications_only: {
    label: 'Apenas candidaturas',
    description:
      'Contratantes acessam seus dados somente quando você se candidatar.',
  },
  verified_employers: {
    label: 'Contratantes verificados',
    description:
      'Seu perfil completo pode ser visto por contratantes validados.',
  },
};

export function CandidateProfileForm() {
  const [draft, setDraft] = useState<CandidateProfileInput>(emptyCandidate());
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [message, setMessage] = useState('Carregando seu perfil…');
  const [isBusy, setIsBusy] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentUser(), getMyProfile()])
      .then(([user, current]) => {
        if (!active) return;
        if (current?.kind === 'candidate') {
          setProfile(current);
          setDraft(toCandidateInput(current));
          setMessage('Perfil carregado.');
        } else {
          setDraft((value) => ({ ...value, displayName: user.displayName }));
          setMessage(
            'Comece com o essencial. Seu perfil nasce privado e você decide quando ampliar o acesso.',
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
    const parsed = candidateProfileInputSchema.safeParse(draft);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Revise os campos.');
      return;
    }

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
    } finally {
      setIsBusy(false);
    }
  }

  async function changeVisibility(visibility: ProfileVisibility) {
    if (!profile) return;
    setIsBusy(true);
    setMessage('Atualizando privacidade…');
    try {
      setProfile(await updateCandidateVisibility(visibility));
      setMessage('Privacidade atualizada.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a privacidade.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function changeActivation(isActive: boolean) {
    if (!profile) return;
    setIsBusy(true);
    try {
      setProfile(await updateCandidateActivation(isActive));
      setMessage(
        isActive
          ? 'Perfil reativado com a mesma regra de privacidade.'
          : 'Perfil desativado e indisponível para contratantes.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar a ativação.',
      );
    } finally {
      setIsBusy(false);
    }
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

  return (
    <div className="profile-workspace">
      <aside className="profile-overview">
        <span className="eyebrow">Perfil profissional</span>
        <h1>Apresente sua trajetória do seu jeito</h1>
        <p>
          Pronomes são opcionais. O Vale não pede orientação sexual nem
          identidade de gênero para liberar oportunidades.
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
        <div className="privacy-note">
          <strong>Privacidade por padrão</strong>
          <p>
            Um perfil novo começa privado. Arquivos nunca ficam em uma pasta
            pública e todo download passa novamente pela autorização.
          </p>
        </div>
      </aside>

      <form className="profile-form" onSubmit={save}>
        <section className="form-section">
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>Apresentação</h2>
              <p>Informações que ajudam a contextualizar seu trabalho.</p>
            </div>
          </div>
          <div className="field-grid">
            <label>
              Nome de exibição
              <input
                disabled={isBusy}
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, displayName: event.target.value })
                }
                required
                value={draft.displayName}
              />
              <span className="field-help">
                Pode ser seu nome social ou profissional.
              </span>
            </label>
            <label>
              Pronomes <span className="optional-mark">Opcional</span>
              <input
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
            </label>
            <label className="field-span">
              Título profissional
              <input
                disabled={isBusy}
                maxLength={140}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    headline: nullable(event.target.value),
                  })
                }
                placeholder="Ex.: Desenvolvedora backend"
                value={draft.headline ?? ''}
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
            <label>
              Disponibilidade <span className="optional-mark">Opcional</span>
              <input
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
            </label>
            <label className="field-span">
              Bio profissional <span className="optional-mark">Opcional</span>
              <textarea
                disabled={isBusy}
                maxLength={2000}
                onChange={(event) =>
                  setDraft({ ...draft, bio: nullable(event.target.value) })
                }
                rows={5}
                value={draft.bio ?? ''}
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>02</span>
            <div>
              <h2>Preferências e habilidades</h2>
              <p>Dados estruturados para os filtros das próximas fases.</p>
            </div>
          </div>
          <div className="field-grid">
            <label>
              Áreas de interesse
              <input
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
            </label>
            <label>
              Habilidades
              <input
                disabled={isBusy}
                onChange={(event) =>
                  setDraft({ ...draft, skills: splitList(event.target.value) })
                }
                placeholder="NestJS, PostgreSQL, UX"
                value={draft.skills.join(', ')}
              />
            </label>
          </div>
          <fieldset className="choice-group">
            <legend>Modalidade desejada</legend>
            <div className="choice-grid">
              {workModes.map((mode) => (
                <label className="checkbox-card" key={mode}>
                  <input
                    checked={draft.workPreferences.workModes.includes(mode)}
                    disabled={isBusy}
                    onChange={() => toggleWorkMode(mode)}
                    type="checkbox"
                  />
                  {workModeLabels[mode]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="choice-group">
            <legend>Regime de trabalho</legend>
            <div className="choice-grid">
              {contractTypes.map((type) => (
                <label className="checkbox-card" key={type}>
                  <input
                    checked={draft.workPreferences.contractTypes.includes(type)}
                    disabled={isBusy}
                    onChange={() => toggleContract(type)}
                    type="checkbox"
                  />
                  {contractLabels[type]}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>03</span>
            <div>
              <h2>Experiência</h2>
              <p>Adicione até 15 experiências profissionais.</p>
            </div>
          </div>
          <div className="repeatable-list">
            {draft.experiences.map((experience, index) => (
              <div className="repeatable-card" key={`experience-${index}`}>
                <div className="repeatable-heading">
                  <strong>Experiência {index + 1}</strong>
                  <button
                    className="text-action danger-text"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        experiences: draft.experiences.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                    type="button"
                  >
                    Remover
                  </button>
                </div>
                <div className="field-grid">
                  <label>
                    Cargo
                    <input
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          experiences: draft.experiences.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, title: event.target.value }
                                : item,
                          ),
                        })
                      }
                      required
                      value={experience.title}
                    />
                  </label>
                  <label>
                    Organização
                    <input
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          experiences: draft.experiences.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, organization: event.target.value }
                                : item,
                          ),
                        })
                      }
                      required
                      value={experience.organization}
                    />
                  </label>
                  <label>
                    Início
                    <input
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          experiences: draft.experiences.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, startDate: event.target.value }
                                : item,
                          ),
                        })
                      }
                      required
                      type="month"
                      value={experience.startDate}
                    />
                  </label>
                  <label>
                    Término
                    <input
                      disabled={experience.current}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          experiences: draft.experiences.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    endDate: nullable(event.target.value),
                                  }
                                : item,
                          ),
                        })
                      }
                      required={!experience.current}
                      type="month"
                      value={experience.endDate ?? ''}
                    />
                  </label>
                  <label className="checkbox-row field-span">
                    <input
                      checked={experience.current}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          experiences: draft.experiences.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    current: event.target.checked,
                                    endDate: event.target.checked
                                      ? null
                                      : item.endDate,
                                  }
                                : item,
                          ),
                        })
                      }
                      type="checkbox"
                    />
                    Trabalho aqui atualmente
                  </label>
                  <label className="field-span">
                    Descrição <span className="optional-mark">Opcional</span>
                    <textarea
                      maxLength={1000}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          experiences: draft.experiences.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    description: nullable(event.target.value),
                                  }
                                : item,
                          ),
                        })
                      }
                      rows={3}
                      value={experience.description ?? ''}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            className="secondary-action"
            disabled={draft.experiences.length >= 15}
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
            type="button"
          >
            Adicionar experiência
          </button>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>04</span>
            <div>
              <h2>Formação e links</h2>
              <p>Inclua formação acadêmica e referências profissionais.</p>
            </div>
          </div>
          <div className="repeatable-list">
            {draft.education.map((education, index) => (
              <div className="repeatable-card" key={`education-${index}`}>
                <div className="repeatable-heading">
                  <strong>Formação {index + 1}</strong>
                  <button
                    className="text-action danger-text"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        education: draft.education.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                    type="button"
                  >
                    Remover
                  </button>
                </div>
                <div className="field-grid">
                  <label>
                    Instituição
                    <input
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          education: draft.education.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, institution: event.target.value }
                              : item,
                          ),
                        })
                      }
                      required
                      value={education.institution}
                    />
                  </label>
                  <label>
                    Curso
                    <input
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          education: draft.education.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, course: event.target.value }
                              : item,
                          ),
                        })
                      }
                      required
                      value={education.course}
                    />
                  </label>
                  <label>
                    Nível <span className="optional-mark">Opcional</span>
                    <input
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          education: draft.education.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, level: nullable(event.target.value) }
                              : item,
                          ),
                        })
                      }
                      value={education.level ?? ''}
                    />
                  </label>
                  <label>
                    Ano de início{' '}
                    <span className="optional-mark">Opcional</span>
                    <input
                      max={2200}
                      min={1940}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          education: draft.education.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  startYear: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : item,
                          ),
                        })
                      }
                      type="number"
                      value={education.startYear ?? ''}
                    />
                  </label>
                  <label>
                    Ano de conclusão{' '}
                    <span className="optional-mark">Opcional</span>
                    <input
                      max={2200}
                      min={1940}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          education: draft.education.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  endYear: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : item,
                          ),
                        })
                      }
                      type="number"
                      value={education.endYear ?? ''}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            className="secondary-action"
            disabled={draft.education.length >= 15}
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
            type="button"
          >
            Adicionar formação
          </button>
          <label className="standalone-field">
            Links profissionais{' '}
            <span className="optional-mark">Um por linha</span>
            <textarea
              onChange={(event) =>
                setDraft({
                  ...draft,
                  professionalLinks: event.target.value
                    .split(/\r?\n/)
                    .map((value) => value.trim())
                    .filter(Boolean),
                })
              }
              placeholder={
                'https://linkedin.com/in/...\nhttps://github.com/...'
              }
              rows={3}
              value={draft.professionalLinks.join('\n')}
            />
          </label>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>05</span>
            <div>
              <h2>Arquivos privados</h2>
              <p>Salve o perfil antes do primeiro envio.</p>
            </div>
          </div>
          {profile ? (
            <div className="asset-grid">
              <ProfileAssetControl
                accept="image/jpeg,image/png,image/webp"
                asset={profile.avatar}
                help="JPEG, PNG ou WebP, até 2 MB."
                kind="avatar"
                label="Avatar"
                onChange={(avatar) => setProfile({ ...profile, avatar })}
              />
              <ProfileAssetControl
                accept="application/pdf"
                asset={profile.resume}
                help="PDF válido, até 5 MB."
                kind="resume"
                label="Currículo"
                onChange={(resume) => setProfile({ ...profile, resume })}
              />
            </div>
          ) : (
            <p className="empty-state">
              Os controles de arquivo aparecem depois que o perfil for salvo.
            </p>
          )}
        </section>

        <section className="form-section privacy-section">
          <div className="form-section-heading">
            <span>06</span>
            <div>
              <h2>Privacidade e ativação</h2>
              <p>Você pode mudar de ideia a qualquer momento.</p>
            </div>
          </div>
          <div className="visibility-options">
            {profileVisibilities.map((visibility) => (
              <label className="visibility-card" key={visibility}>
                <input
                  checked={(profile?.visibility ?? 'private') === visibility}
                  disabled={!profile || isBusy}
                  name="visibility"
                  onChange={() => changeVisibility(visibility)}
                  type="radio"
                />
                <span>
                  <strong>{visibilityCopy[visibility].label}</strong>
                  <small>{visibilityCopy[visibility].description}</small>
                </span>
              </label>
            ))}
          </div>
          <label className="activation-control">
            <input
              checked={profile?.isActive ?? true}
              disabled={!profile || isBusy}
              onChange={(event) => changeActivation(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>Perfil ativo</strong>
              <small>
                Desative para impedir qualquer acesso de contratantes sem apagar
                sua trajetória.
              </small>
            </span>
          </label>
        </section>

        <div className="form-footer">
          <p className="profile-message" role="status">
            {message}
          </p>
          <button className="primary-action" disabled={isBusy} type="submit">
            {isBusy ? 'Aguarde…' : 'Salvar perfil'}
          </button>
        </div>
      </form>
    </div>
  );
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
  return clean ? value : null;
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
