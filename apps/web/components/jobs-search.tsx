'use client';

import {
  faMagnifyingGlass,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import type {
  ContractType,
  JobSeniority,
  PublicJobPage,
  WorkMode,
} from '@vale/shared';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { ApiRequestError, searchJobs } from '@/lib/api';

import {
  contractLabels,
  formatSalary,
  JobMetadata,
  seniorityLabels,
  workModeLabels,
} from './market-status';
import { ActionLink, Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { FormField, Select, TextInput } from './ui/form-field';
import { Icon } from './ui/icon';
import { PageHeading } from './ui/page-heading';

type JobFilters = {
  area: string;
  contractType: ContractType | '';
  location: string;
  q: string;
  seniority: JobSeniority | '';
  workMode: WorkMode | '';
};

const initialFilters: JobFilters = {
  q: '',
  area: '',
  location: '',
  workMode: '',
  contractType: '',
  seniority: '',
};

const filterLabels: Record<keyof JobFilters, string> = {
  q: 'Busca',
  area: 'Área',
  location: 'Localidade',
  workMode: 'Modalidade',
  contractType: 'Contrato',
  seniority: 'Senioridade',
};

function filterValue(
  key: keyof JobFilters,
  value: JobFilters[keyof JobFilters],
) {
  if (key === 'workMode' && value) return workModeLabels[value as WorkMode];
  if (key === 'contractType' && value) {
    return contractLabels[value as ContractType];
  }
  if (key === 'seniority' && value) {
    return seniorityLabels[value as JobSeniority];
  }
  return value;
}

export function JobsSearch() {
  const [result, setResult] = useState<PublicJobPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState<JobFilters>(initialFilters);

  const load = useCallback(async (criteria: JobFilters, page = 1) => {
    setLoading(true);
    setMessage('');
    try {
      setResult(
        await searchJobs({
          ...criteria,
          workMode: criteria.workMode || undefined,
          contractType: criteria.contractType || undefined,
          seniority: criteria.seniority || undefined,
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
  }, []);

  useEffect(() => {
    void load(initialFilters);
  }, [load]);

  const activeFilters = useMemo(
    () =>
      (Object.entries(filters) as Array<[keyof JobFilters, string]>).filter(
        ([, value]) => Boolean(value),
      ),
    [filters],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load(filters);
  }

  function removeFilter(key: keyof JobFilters) {
    const next = { ...filters, [key]: '' } as JobFilters;
    setFilters(next);
    void load(next);
  }

  function clearFilters() {
    setFilters(initialFilters);
    void load(initialFilters);
  }

  return (
    <main className="mx-auto grid w-full max-w-vale-wide gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.6fr)] lg:px-8 lg:py-14">
      <Card as="aside" className="h-fit p-5 sm:p-6 lg:sticky lg:top-6">
        <PageHeading
          as="h1"
          description="Toda vaga passa por revisão antes de aparecer aqui. Combine termos, área e formato de trabalho para refinar a busca."
          eyebrow="Oportunidades moderadas"
          title="Encontre um trabalho que respeite quem você é"
        />

        <form
          className="mt-7 grid gap-5 border-t border-vale-border pt-6"
          onSubmit={submit}
        >
          <FormField id="job-search" label="Buscar oportunidades">
            <TextInput
              leadingIcon={<Icon icon={faMagnifyingGlass} />}
              onChange={(event) =>
                setFilters((current) => ({ ...current, q: event.target.value }))
              }
              placeholder="Cargo, área ou organização"
              type="search"
              value={filters.q}
            />
          </FormField>
          <FormField id="job-area" label="Área">
            <TextInput
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  area: event.target.value,
                }))
              }
              placeholder="Ex.: Tecnologia"
              value={filters.area}
            />
          </FormField>
          <FormField id="job-location" label="Localidade">
            <TextInput
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="Cidade, estado ou remoto"
              value={filters.location}
            />
          </FormField>
          <FormField id="job-work-mode" label="Modalidade">
            <Select
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  workMode: event.target.value as WorkMode | '',
                }))
              }
              value={filters.workMode}
            >
              <option value="">Todas</option>
              {Object.entries(workModeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="job-contract" label="Contrato">
            <Select
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  contractType: event.target.value as ContractType | '',
                }))
              }
              value={filters.contractType}
            >
              <option value="">Todos</option>
              {Object.entries(contractLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="job-seniority" label="Senioridade">
            <Select
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  seniority: event.target.value as JobSeniority | '',
                }))
              }
              value={filters.seniority}
            >
              <option value="">Todas</option>
              {Object.entries(seniorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              loading={loading}
              loadingLabel="Buscando vagas"
              type="submit"
            >
              <Icon icon={faSliders} />
              Buscar vagas
            </Button>
            {activeFilters.length ? (
              <Button
                disabled={loading}
                onClick={clearFilters}
                type="button"
                variant="ghost"
              >
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <section aria-labelledby="jobs-results-heading" className="min-w-0">
        <div className="flex flex-col gap-4 border-b border-vale-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-vale-action">
              Busca pública
            </p>
            <h2
              className="mt-2 text-3xl font-black tracking-[-0.045em] text-vale-ink sm:text-4xl"
              id="jobs-results-heading"
            >
              Vagas disponíveis
            </h2>
          </div>
          <div aria-live="polite" className="text-sm font-bold text-vale-muted">
            {result
              ? `${result.total} ${result.total === 1 ? 'oportunidade' : 'oportunidades'} · mais recentes primeiro`
              : 'Carregando oportunidades'}
          </div>
        </div>

        {activeFilters.length ? (
          <div
            className="mt-5 flex flex-wrap items-center gap-2"
            aria-label="Filtros aplicados"
          >
            <span className="text-sm font-bold text-vale-muted">
              Filtros aplicados:
            </span>
            {activeFilters.map(([key, value]) => (
              <Button
                className="!min-h-8 !rounded-full !px-3 !py-1 !text-xs"
                key={key}
                onClick={() => removeFilter(key)}
                size="sm"
                type="button"
                variant="secondary"
              >
                {filterLabels[key]}: {filterValue(key, value)} ×
              </Button>
            ))}
          </div>
        ) : null}

        {message ? (
          <Alert
            className="mt-6"
            title="Não foi possível atualizar a busca"
            tone="danger"
          >
            {message}
          </Alert>
        ) : null}

        {loading && !result ? (
          <Card className="mt-6 p-6">
            <LoadingState label="Buscando oportunidades disponíveis" />
          </Card>
        ) : null}

        {!loading && result?.items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              action={
                activeFilters.length ? (
                  <Button onClick={clearFilters} variant="secondary">
                    Limpar filtros
                  </Button>
                ) : undefined
              }
              description="Revise um filtro ou tente uma busca mais ampla."
              title="Nenhuma vaga corresponde à sua busca"
            />
          </div>
        ) : null}

        {loading && result ? (
          <div className="mt-5">
            <LoadingState label="Atualizando resultados" />
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {result?.items.map((job) => (
            <Card
              className="grid gap-5 p-5 transition hover:border-vale-action/40 hover:shadow-vale-card sm:p-6"
              key={job.id}
            >
              <JobMetadata
                area={job.area}
                contractType={job.contractType}
                seniority={job.seniority}
                workMode={job.workMode}
              />
              <div>
                <h3 className="text-xl font-black tracking-[-0.03em] text-vale-ink sm:text-2xl">
                  {job.title}
                </h3>
                <p className="mt-2 text-sm font-semibold text-vale-muted">
                  {job.employer.displayName}
                  {job.employer.isVerified ? ' · Organização verificada' : ''}
                </p>
              </div>
              <p className="text-sm leading-6 text-vale-muted">
                {job.description}
              </p>
              <div className="flex flex-col gap-4 border-t border-vale-border pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-extrabold text-vale-ink">
                    {formatSalary(job)}
                  </p>
                  <p className="mt-1 text-sm text-vale-muted">
                    {job.location} · {seniorityLabels[job.seniority]}
                  </p>
                </div>
                <ActionLink href={`/vagas/${job.id}`} variant="secondary">
                  Ver detalhes
                </ActionLink>
              </div>
            </Card>
          ))}
        </div>

        {result && result.totalPages > 1 ? (
          <nav
            aria-label="Paginação de vagas"
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              disabled={loading || result.page <= 1}
              onClick={() => void load(filters, result.page - 1)}
              variant="secondary"
            >
              Anterior
            </Button>
            <span className="text-sm font-bold text-vale-muted">
              Página {result.page} de {result.totalPages}
            </span>
            <Button
              disabled={loading || result.page >= result.totalPages}
              onClick={() => void load(filters, result.page + 1)}
              variant="secondary"
            >
              Próxima
            </Button>
          </nav>
        ) : null}
      </section>
    </main>
  );
}
