import { AuditEvent } from './audit-event.entity';
import { AuditService } from './audit.service';

describe('AuditService context minimization', () => {
  const repository = {
    create: jest.fn((input: Partial<AuditEvent>) => input),
    save: jest.fn(async (input: Partial<AuditEvent>) => input),
  };
  const service = new AuditService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps only the fields allowed for the event action', async () => {
    await service.record({
      actorUserId: '4a5021bd-e795-43f2-93a8-1bf1cfd0b846',
      targetUserId: 'a91f45dd-12db-47d4-a567-85c46b7e8ff9',
      action: 'candidate_profile.updated',
      context: {
        bio: 'conteúdo sensível',
        changedFields: ['bio', 'skills'],
        description: 'descrição sensível',
        password: 'senha',
        resume: { fileName: 'curriculo.pdf' },
        token: 'segredo',
      },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { changedFields: ['bio', 'skills'] },
      }),
    );
    const serialized = JSON.stringify(repository.create.mock.calls[0]?.[0]);
    expect(serialized).not.toContain('conteúdo sensível');
    expect(serialized).not.toContain('descrição sensível');
    expect(serialized).not.toContain('curriculo.pdf');
    expect(serialized).not.toContain('segredo');
    expect(serialized).not.toContain('senha');
  });

  it('does not accept nested values even under an allowed key', async () => {
    await service.record({
      actorUserId: '4a5021bd-e795-43f2-93a8-1bf1cfd0b846',
      targetUserId: 'a91f45dd-12db-47d4-a567-85c46b7e8ff9',
      action: 'auth.login_failed',
      context: {
        outcome: 'failure',
        reason: { password: 'never-store-this' },
      },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { outcome: 'failure' },
      }),
    );
  });
});
