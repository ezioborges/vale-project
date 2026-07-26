'use client';

import type {
  ContractType,
  JobSeniority,
  PublicJobPage,
  WorkMode,
} from '@vale/shared';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { ApiRequestError, searchJobs } from '@/lib/api';

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

const seniorityLabels: Record<JobSeniority, string> = {
  intern: 'Estágio',
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Liderança',
  specialist: 'Especialista',
  not_applicable: 'Não se aplica',
};

function salary(job: PublicJobPage['items'][number]): string {
  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `${job.salaryMin.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })} – ${job.salaryMax.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })}`;
  }
  return job.salaryHiddenReason ?? 'Faixa não informada';
}

export function JobsSearch() {
  const [result, setResult] = useState<PublicJobPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    area: '',
    location: '',
    workMode: '' as WorkMode | '',
    contractType: '' as ContractType | '',
    seniority: '' as JobSeniority | '',
  });

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setMessage('');
      try {
        setResult(
          await searchJobs({
            ...filters,
            workMode: filters.workMode || undefined,
            contractType: filters.contractType || undefined,
            seniority: filters.seniority || undefined,
            page,
            limit: 12,
          }),
        );
      } catch (error) {
        setMessage(
          error instanceof ApiRequestError
            ? error.message
            : 'Não foi possível carregar as vagas agora.',
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    void load();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load(1);
  }

  return (
    <div className="jobs-layout">
      <aside className="jobs-filter-panel">
        <span className="eyebrow">Oportunidades moderadas</span>
        <h1>Encontre um trabalho que respeite quem você é.</h1>
        <p>
          Toda vaga passa por revisão antes de aparecer aqui. Combine termos,
          área e formato de trabalho para refinar a busca.
        </p>

        <form className="jobs-filter-form" onSubmit={submit}>
          <label>
            Buscar
            <input
              value={filters.q}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
              placeholder="Cargo, área ou organização"
            />
          </label>
          <label>
            Área
            <input
              value={filters.area}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  area: event.target.value,
                }))
              }
              placeholder="Ex.: Tecnologia"
            />
          </label>
          <label>
            Localidade
            <input
              value={filters.location}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="Cidade, estado ou remoto"
            />
          </label>
          <label>
            Modalidade
            <select
              value={filters.workMode}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  workMode: event.target.value as WorkMode | '',
                }))
              }
            >
              <option value="">Todas</option>
              {Object.entries(workModeLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contrato
            <select
              value={filters.contractType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  contractType: event.target.value as ContractType | '',
                }))
              }
            >
              <option value="">Todos</option>
              {Object.entries(contractLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Senioridade
            <select
              value={filters.seniority}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  seniority: event.target.value as JobSeniority | '',
                }))
              }
            >
              <option value="">Todas</option>
              {Object.entries(seniorityLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-action" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar vagas'}
          </button>
        </form>
      </aside>

      <section className="jobs-results" aria-live="polite" aria-busy={loading}>
        <div className="jobs-results-heading">
          <div>
            <span className="eyebrow">Busca pública</span>
            <h2>Vagas disponíveis</h2>
          </div>
          {result && (
            <strong>
              {result.total}{' '}
              {result.total === 1 ? 'oportunidade' : 'oportunidades'}
            </strong>
          )}
        </div>

        {message && <p className="notice error-notice">{message}</p>}
        {loading && !result && (
          <div className="empty-state-card">Carregando oportunidades…</div>
        )}
        {!loading && result?.items.length === 0 && (
          <div className="empty-state-card">
            <strong>Nenhuma vaga corresponde aos filtros.</strong>
            <span>Revise um campo ou tente uma busca mais ampla.</span>
          </div>
        )}
        <div className="job-card-list">
          {result?.items.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-card-meta">
                <span>{job.area}</span>
                <span>{workModeLabels[job.workMode]}</span>
                <span>{contractLabels[job.contractType]}</span>
              </div>
              <div>
                <h3>{job.title}</h3>
                <p className="job-employer">
                  {job.employer.displayName}
                  {job.employer.isVerified ? ' · organização verificada' : ''}
                </p>
              </div>
              <p className="job-description-preview">{job.description}</p>
              <div className="job-card-footer">
                <div>
                  <strong>{salary(job)}</strong>
                  <span>
                    {job.location} · {seniorityLabels[job.seniority]}
                  </span>
                </div>
                <Link
                  className="secondary-action"
                  href={`/vagas/${job.id}`}
                  aria-label={`Ver detalhes de ${job.title}`}
                >
                  Ver detalhes
                </Link>
              </div>
            </article>
          ))}
        </div>

        {result && result.totalPages > 1 && (
          <nav className="pagination" aria-label="Paginação de vagas">
            <button
              className="secondary-action"
              disabled={loading || result.page <= 1}
              onClick={() => void load(result.page - 1)}
            >
              Anterior
            </button>
            <span>
              Página {result.page} de {result.totalPages}
            </span>
            <button
              className="secondary-action"
              disabled={loading || result.page >= result.totalPages}
              onClick={() => void load(result.page + 1)}
            >
              Próxima
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
