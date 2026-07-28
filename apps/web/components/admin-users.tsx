'use client';

import type {
  AdminUser,
  AdminUserPage,
  UserRole,
  UserStatus,
} from '@vale/shared';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import {
  ApiRequestError,
  listAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '@/lib/api';

import { userRoleLabels, userStatusLabels } from './governance-status';
import { Badge, type BadgeTone } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog } from './ui/dialog';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { FormField, Select, TextArea, TextInput } from './ui/form-field';
import { Pagination } from './ui/pagination';
import { PageHeading } from './ui/page-heading';

type EditableStatus = Exclude<UserStatus, 'pending_email'>;

type UserFilters = {
  q: string;
  role: UserRole | '';
  status: UserStatus | '';
};

type Feedback = {
  message: string;
  tone: 'danger' | 'info' | 'success';
};

type PendingChange =
  | {
      kind: 'role';
      reason: string;
      user: AdminUser;
      value: UserRole;
    }
  | {
      kind: 'status';
      reason: string;
      user: AdminUser;
      value: EditableStatus;
    };

const userStatusTones: Record<UserStatus, BadgeTone> = {
  pending_email: 'warning',
  active: 'success',
  suspended: 'warning',
  disabled: 'danger',
};

function failureMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError && error.status === 403) {
    return 'Esta sessão não pode administrar contas.';
  }

  return error instanceof Error ? error.message : fallback;
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge tone={userStatusTones[status]}>{userStatusLabels[status]}</Badge>
  );
}

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <div>
      <UserStatusBadge status={user.status} />
      <h2 className="mt-3 text-lg font-black tracking-[-0.03em] text-vale-ink">
        {user.displayName}
      </h2>
      <p className="mt-1 break-all text-sm font-semibold text-vale-muted">
        {user.email}
      </p>
      <p className="mt-3 text-xs leading-5 text-vale-muted">
        Criada em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
        {user.lastLoginAt
          ? ` · último acesso ${new Date(user.lastLoginAt).toLocaleString('pt-BR')}`
          : ' · sem login registrado'}
      </p>
    </div>
  );
}

function UserAccessControls({
  idPrefix,
  onRequestRole,
  onRequestStatus,
  onRoleChange,
  onStatusChange,
  role,
  saving,
  status,
  user,
}: {
  idPrefix: string;
  onRequestRole: (user: AdminUser) => void;
  onRequestStatus: (user: AdminUser) => void;
  onRoleChange: (value: UserRole) => void;
  onStatusChange: (value: EditableStatus) => void;
  role: UserRole;
  saving: boolean;
  status: EditableStatus;
  user: AdminUser;
}) {
  return (
    <div className="grid gap-4">
      <FormField id={`${idPrefix}-role`} label="Papel">
        <Select
          disabled={saving}
          onChange={(event) => onRoleChange(event.target.value as UserRole)}
          value={role}
        >
          {Object.entries(userRoleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>
      <Button
        disabled={saving || role === user.role}
        onClick={() => onRequestRole(user)}
        size="sm"
        variant="secondary"
      >
        Confirmar papel
      </Button>

      <FormField id={`${idPrefix}-status`} label="Estado da conta">
        <Select
          disabled={saving}
          onChange={(event) =>
            onStatusChange(event.target.value as EditableStatus)
          }
          value={status}
        >
          <option value="active">Ativa</option>
          <option value="suspended">Suspensa</option>
          <option value="disabled">Desativada</option>
        </Select>
      </FormField>
      <Button
        disabled={saving || status === user.status}
        onClick={() => onRequestStatus(user)}
        size="sm"
        variant={
          status === 'disabled' || status === 'suspended'
            ? 'danger'
            : 'secondary'
        }
      >
        Confirmar estado
      </Button>
    </div>
  );
}

function ReasonControl({
  id,
  onChange,
  saving,
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  saving: boolean;
  value: string;
}) {
  return (
    <FormField
      hint="Necessário para qualquer alteração. Não inclua informação sensível além do necessário."
      id={id}
      label="Motivo administrativo"
      required
    >
      <TextArea
        disabled={saving}
        maxLength={500}
        minLength={10}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Explique a necessidade da alteração."
        required
        rows={3}
        value={value}
      />
    </FormField>
  );
}

export function AdminUsers() {
  const [result, setResult] = useState<AdminUserPage | null>(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({
    q: '',
    role: '',
    status: '',
  });
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});
  const [draftStatuses, setDraftStatuses] = useState<
    Record<string, EditableStatus>
  >({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const load = useCallback(
    async (page = 1, filters = appliedFilters) => {
      setLoading(true);
      try {
        const nextResult = await listAdminUsers({
          page,
          q: filters.q || undefined,
          role: filters.role || undefined,
          status: filters.status || undefined,
        });
        setResult(nextResult);
        setDraftRoles(
          Object.fromEntries(
            nextResult.items.map((user) => [user.id, user.role]),
          ),
        );
        setDraftStatuses(
          Object.fromEntries(
            nextResult.items.map((user) => [
              user.id,
              user.status === 'pending_email' ? 'active' : user.status,
            ]),
          ),
        );
      } catch (error) {
        setFeedback({
          message: failureMessage(
            error,
            'Não foi possível carregar as contas.',
          ),
          tone: 'danger',
        });
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setAppliedFilters({ q: q.trim(), role, status });
  }

  function reasonFor(user: AdminUser) {
    const reason = reasons[user.id]?.trim();
    if (!reason || reason.length < 10) {
      setFeedback({
        message:
          'Informe um motivo com pelo menos 10 caracteres antes de confirmar.',
        tone: 'danger',
      });
      return null;
    }

    return reason;
  }

  function requestRole(user: AdminUser) {
    const value = draftRoles[user.id] ?? user.role;
    const reason = reasonFor(user);
    if (!reason) return;
    if (value === user.role) {
      setFeedback({
        message: 'Escolha um papel diferente antes de confirmar.',
        tone: 'info',
      });
      return;
    }

    setPendingChange({ kind: 'role', reason, user, value });
  }

  function requestStatus(user: AdminUser) {
    const value =
      draftStatuses[user.id] ??
      (user.status === 'pending_email' ? 'active' : user.status);
    const reason = reasonFor(user);
    if (!reason) return;
    if (value === user.status) {
      setFeedback({
        message: 'Escolha um estado diferente antes de confirmar.',
        tone: 'info',
      });
      return;
    }

    setPendingChange({ kind: 'status', reason, user, value });
  }

  async function confirmChange() {
    if (!pendingChange) return;

    setSavingId(pendingChange.user.id);
    try {
      if (pendingChange.kind === 'role') {
        await updateAdminUserRole(
          pendingChange.user.id,
          pendingChange.value,
          pendingChange.reason,
        );
      } else {
        await updateAdminUserStatus(
          pendingChange.user.id,
          pendingChange.value,
          pendingChange.reason,
        );
      }

      setReasons((current) => ({ ...current, [pendingChange.user.id]: '' }));
      setPendingChange(null);
      await load(result?.page ?? 1);
      setFeedback({
        message:
          pendingChange.kind === 'role'
            ? 'Papel atualizado e sessões anteriores revogadas.'
            : 'Estado atualizado; sessões sensíveis foram revogadas quando aplicável.',
        tone: 'success',
      });
    } catch (error) {
      setPendingChange(null);
      setFeedback({
        message: failureMessage(error, 'Não foi possível atualizar a conta.'),
        tone: 'danger',
      });
    } finally {
      setSavingId(null);
    }
  }

  const users = result?.items ?? [];

  return (
    <section className="mx-auto max-w-vale-wide">
      <PageHeading
        as="h1"
        description="Mudanças de papel e estado exigem motivo, confirmação contextual e auditoria. A API continua impedindo autoalterações e mudanças sem permissão."
        eyebrow="Administração restrita"
        title="Usuários e acessos"
      />

      <form
        className="mt-8 grid gap-4 rounded-vale-lg border border-vale-border bg-vale-surface p-5 sm:grid-cols-2 lg:grid-cols-[minmax(15rem,1.5fr)_minmax(11rem,0.8fr)_minmax(11rem,0.8fr)_auto] lg:items-end lg:p-6"
        onSubmit={search}
      >
        <FormField id="admin-user-search" label="Buscar">
          <TextInput
            onChange={(event) => setQ(event.target.value)}
            placeholder="Nome ou e-mail"
            type="search"
            value={q}
          />
        </FormField>
        <FormField id="admin-user-role" label="Papel">
          <Select
            onChange={(event) => setRole(event.target.value as UserRole | '')}
            value={role}
          >
            <option value="">Todos os papéis</option>
            {Object.entries(userRoleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="admin-user-status" label="Estado">
          <Select
            onChange={(event) =>
              setStatus(event.target.value as UserStatus | '')
            }
            value={status}
          >
            <option value="">Todos os estados</option>
            {Object.entries(userStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <Button type="submit">Aplicar filtros</Button>
      </form>

      <p aria-live="polite" className="mt-4 text-sm font-bold text-vale-muted">
        {result ? `${result.total} conta(s) neste recorte` : 'Carregando'}
      </p>

      {feedback ? (
        <Alert
          className="mt-6"
          title={
            feedback.tone === 'success'
              ? 'Alteração registrada'
              : feedback.tone === 'info'
                ? 'Revise a alteração'
                : 'Não foi possível concluir'
          }
          tone={feedback.tone}
        >
          {feedback.message}
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-8">
          <LoadingState label="Carregando contas" />
        </div>
      ) : null}

      {!loading && users.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            description="Ajuste os filtros ou tente um termo de busca diferente."
            title="Nenhuma conta neste recorte"
          />
        </div>
      ) : null}

      {!loading && users.length ? (
        <>
          <div className="mt-8 hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[72rem] border-separate border-spacing-0 overflow-hidden rounded-vale-lg border border-vale-border bg-vale-surface text-left">
              <caption className="sr-only">
                Contas encontradas com controles administrativos por linha.
              </caption>
              <thead className="bg-vale-neutral-subtle text-sm text-vale-muted">
                <tr>
                  <th className="px-5 py-4 font-extrabold" scope="col">
                    Pessoa
                  </th>
                  <th className="px-5 py-4 font-extrabold" scope="col">
                    Alterações de acesso
                  </th>
                  <th className="px-5 py-4 font-extrabold" scope="col">
                    Motivo e confirmação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vale-border">
                {users.map((user) => (
                  <tr className="align-top" key={user.id}>
                    <td className="px-5 py-5">
                      <UserIdentity user={user} />
                    </td>
                    <td className="px-5 py-5">
                      <UserAccessControls
                        idPrefix={`desktop-${user.id}`}
                        onRequestRole={requestRole}
                        onRequestStatus={requestStatus}
                        onRoleChange={(value) =>
                          setDraftRoles((current) => ({
                            ...current,
                            [user.id]: value,
                          }))
                        }
                        onStatusChange={(value) =>
                          setDraftStatuses((current) => ({
                            ...current,
                            [user.id]: value,
                          }))
                        }
                        role={draftRoles[user.id] ?? user.role}
                        saving={savingId === user.id}
                        status={
                          draftStatuses[user.id] ??
                          (user.status === 'pending_email'
                            ? 'active'
                            : user.status)
                        }
                        user={user}
                      />
                    </td>
                    <td className="px-5 py-5">
                      <ReasonControl
                        id={`desktop-${user.id}-reason`}
                        onChange={(value) =>
                          setReasons((current) => ({
                            ...current,
                            [user.id]: value,
                          }))
                        }
                        saving={savingId === user.id}
                        value={reasons[user.id] ?? ''}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-5 lg:hidden">
            {users.map((user) => (
              <Card className="grid gap-6 p-5" key={user.id}>
                <UserIdentity user={user} />
                <UserAccessControls
                  idPrefix={`mobile-${user.id}`}
                  onRequestRole={requestRole}
                  onRequestStatus={requestStatus}
                  onRoleChange={(value) =>
                    setDraftRoles((current) => ({
                      ...current,
                      [user.id]: value,
                    }))
                  }
                  onStatusChange={(value) =>
                    setDraftStatuses((current) => ({
                      ...current,
                      [user.id]: value,
                    }))
                  }
                  role={draftRoles[user.id] ?? user.role}
                  saving={savingId === user.id}
                  status={
                    draftStatuses[user.id] ??
                    (user.status === 'pending_email' ? 'active' : user.status)
                  }
                  user={user}
                />
                <ReasonControl
                  id={`mobile-${user.id}-reason`}
                  onChange={(value) =>
                    setReasons((current) => ({
                      ...current,
                      [user.id]: value,
                    }))
                  }
                  saving={savingId === user.id}
                  value={reasons[user.id] ?? ''}
                />
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {result ? (
        <Pagination
          disabled={loading}
          label="Paginação de usuários"
          onPageChange={(page) => void load(page)}
          page={result.page}
          totalPages={result.totalPages}
        />
      ) : null}

      {pendingChange ? (
        <Dialog
          confirmLabel={
            pendingChange.kind === 'role'
              ? 'Alterar papel'
              : 'Alterar estado da conta'
          }
          confirmLoading={savingId === pendingChange.user.id}
          description={
            pendingChange.kind === 'role'
              ? `Você vai alterar o papel de ${pendingChange.user.displayName}. A mudança pode ampliar ou reduzir acessos e revogará sessões anteriores.`
              : `Você vai definir a conta de ${pendingChange.user.displayName} como ${userStatusLabels[pendingChange.value]}. Suspensão ou desativação pode interromper o acesso imediatamente; uma nova alteração administrativa pode reverter o estado quando a política permitir.`
          }
          onClose={() => setPendingChange(null)}
          onConfirm={() => void confirmChange()}
          open
          title={
            pendingChange.kind === 'role'
              ? 'Confirmar alteração de papel?'
              : 'Confirmar alteração de estado?'
          }
          tone={
            pendingChange.kind === 'status' &&
            (pendingChange.value === 'disabled' ||
              pendingChange.value === 'suspended')
              ? 'danger'
              : 'default'
          }
        >
          <dl className="grid gap-3 rounded-vale-md bg-vale-neutral-subtle p-4 text-sm">
            <div>
              <dt className="font-bold text-vale-muted">Conta</dt>
              <dd className="mt-1 font-extrabold text-vale-ink">
                {pendingChange.user.displayName}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-vale-muted">Nova definição</dt>
              <dd className="mt-1 font-extrabold text-vale-ink">
                {pendingChange.kind === 'role'
                  ? userRoleLabels[pendingChange.value]
                  : userStatusLabels[pendingChange.value]}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-vale-muted">Motivo registrado</dt>
              <dd className="mt-1 whitespace-pre-line text-vale-ink">
                {pendingChange.reason}
              </dd>
            </div>
          </dl>
        </Dialog>
      ) : null}
    </section>
  );
}
