'use client';

import type { AdminUser, UserRole, UserStatus } from '@vale/shared';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import {
  ApiRequestError,
  listAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '@/lib/api';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  coordinator: 'Coordenação',
  employer: 'Contratante',
  candidate: 'Candidato',
};

const statusLabels: Record<UserStatus, string> = {
  pending_email: 'E-mail pendente',
  active: 'Ativa',
  suspended: 'Suspensa',
  disabled: 'Desativada',
};

export function AdminUsers() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});
  const [draftStatuses, setDraftStatuses] = useState<
    Record<string, Exclude<UserStatus, 'pending_email'>>
  >({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await listAdminUsers({
        q: q.trim() || undefined,
        role: role || undefined,
        status: status || undefined,
      });
      setItems(result.items);
      setDraftRoles(
        Object.fromEntries(result.items.map((user) => [user.id, user.role])),
      );
      setDraftStatuses(
        Object.fromEntries(
          result.items.map((user) => [
            user.id,
            user.status === 'pending_email' ? 'active' : user.status,
          ]),
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível carregar as contas.',
      );
    } finally {
      setLoading(false);
    }
  }, [q, role, status]);

  useEffect(() => {
    void load();
    // Filters are applied by the explicit search action.
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  function reasonFor(userId: string): string | null {
    const reason = reasons[userId]?.trim();
    if (!reason || reason.length < 10) {
      setMessage('Informe um motivo com pelo menos 10 caracteres.');
      return null;
    }
    return reason;
  }

  async function saveRole(user: AdminUser) {
    const reason = reasonFor(user.id);
    if (!reason) return;
    try {
      await updateAdminUserRole(
        user.id,
        draftRoles[user.id] ?? user.role,
        reason,
      );
      setMessage('Papel atualizado e sessões anteriores revogadas.');
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Falha ao atualizar.',
      );
    }
  }

  async function saveStatus(user: AdminUser) {
    const reason = reasonFor(user.id);
    if (!reason) return;
    try {
      await updateAdminUserStatus(
        user.id,
        draftStatuses[user.id] ?? 'active',
        reason,
      );
      setMessage('Status atualizado e sessões sensíveis revogadas.');
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Falha ao atualizar.',
      );
    }
  }

  return (
    <section className="management-page admin-users-page">
      <div className="management-hero">
        <span className="eyebrow">Administração restrita</span>
        <h1>Usuários e acessos</h1>
        <p>
          Mudanças de papel e status exigem motivo, geram auditoria e invalidam
          sessões quando alteram privilégios ou bloqueiam a conta.
        </p>
      </div>

      <form className="admin-filter-bar" onSubmit={search}>
        <label>
          Buscar
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Nome ou e-mail"
          />
        </label>
        <label>
          Papel
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole | '')}
          >
            <option value="">Todos</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as UserStatus | '')
            }
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-action">Aplicar filtros</button>
      </form>

      {message && <p className="notice">{message}</p>}
      {loading && <div className="empty-state-card">Carregando contas…</div>}
      {!loading && items.length === 0 && (
        <div className="empty-state-card">Nenhuma conta neste recorte.</div>
      )}

      <div className="admin-user-list">
        {items.map((user) => (
          <article className="admin-user-card" key={user.id}>
            <div className="admin-user-identity">
              <span className={`status-badge status-user-${user.status}`}>
                {statusLabels[user.status]}
              </span>
              <h2>{user.displayName}</h2>
              <p>{user.email}</p>
              <small>
                Criada em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                {user.lastLoginAt
                  ? ` · último acesso ${new Date(user.lastLoginAt).toLocaleString('pt-BR')}`
                  : ' · sem login registrado'}
              </small>
            </div>
            <div className="admin-user-controls">
              <label>
                Papel
                <select
                  value={draftRoles[user.id] ?? user.role}
                  onChange={(event) =>
                    setDraftRoles((current) => ({
                      ...current,
                      [user.id]: event.target.value as UserRole,
                    }))
                  }
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="secondary-action"
                onClick={() => void saveRole(user)}
              >
                Salvar papel
              </button>
              <label>
                Status
                <select
                  value={
                    draftStatuses[user.id] ??
                    (user.status === 'pending_email' ? 'active' : user.status)
                  }
                  onChange={(event) =>
                    setDraftStatuses((current) => ({
                      ...current,
                      [user.id]: event.target.value as Exclude<
                        UserStatus,
                        'pending_email'
                      >,
                    }))
                  }
                >
                  <option value="active">Ativa</option>
                  <option value="suspended">Suspensa</option>
                  <option value="disabled">Desativada</option>
                </select>
              </label>
              <button
                className="secondary-action"
                onClick={() => void saveStatus(user)}
              >
                Salvar status
              </button>
              <label className="admin-reason-field">
                Motivo obrigatório para qualquer alteração
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reasons[user.id] ?? ''}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [user.id]: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
