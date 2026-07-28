import 'reflect-metadata';

import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';

import dataSource from './data-source';
import { CandidateProfile } from '../profiles/candidate-profile.entity';
import { EmployerProfile } from '../profiles/employer-profile.entity';
import { TermAcceptance } from '../terms/term-acceptance.entity';
import { User } from '../users/user.entity';

const DEV_PASSWORD = 'ValeDev2026!';
const DEV_USER_AGENT = 'docker-dev-db-reset';

type SeedUser = {
  displayName: string;
  email: string;
  role: User['role'];
};

const seedUsers: SeedUser[] = [
  {
    displayName: 'Administração Vale',
    email: 'admin@local.vale.test',
    role: 'admin',
  },
  {
    displayName: 'Coordenação Vale',
    email: 'coordinator@local.vale.test',
    role: 'coordinator',
  },
  {
    displayName: 'Empresa Exemplo Vale',
    email: 'employer@local.vale.test',
    role: 'employer',
  },
  {
    displayName: 'Pessoa Candidata Vale',
    email: 'candidate@local.vale.test',
    role: 'candidate',
  },
];

async function resetSchema(source: DataSource): Promise<void> {
  await source.query('DROP SCHEMA public CASCADE');
  await source.query('CREATE SCHEMA public');
  await source.runMigrations();
}

async function seed(source: DataSource): Promise<void> {
  const userRepository = source.getRepository(User);
  const termRepository = source.getRepository(TermAcceptance);
  const passwordHash = await argon2.hash(DEV_PASSWORD);
  const legalVersions = {
    terms: process.env.LEGAL_TERMS_VERSION ?? 'terms-2026-07-24',
    privacy: process.env.LEGAL_PRIVACY_VERSION ?? 'privacy-2026-07-24',
    guidelines:
      process.env.LEGAL_GUIDELINES_VERSION ?? 'guidelines-2026-07-24',
  } as const;

  const users = new Map<User['role'], User>();

  for (const input of seedUsers) {
    const user = userRepository.create({
      displayName: input.displayName,
      email: input.email,
      passwordHash,
      role: input.role,
      status: 'active',
      emailVerifiedAt: new Date(),
      lastLoginAt: null,
    });
    users.set(input.role, await userRepository.save(user));
  }

  for (const user of users.values()) {
    await termRepository.save(
      Object.entries(legalVersions).map(([documentType, version]) =>
        termRepository.create({
          userId: user.id,
          documentType: documentType as 'terms' | 'privacy' | 'guidelines',
          version,
          ipAddress: null,
          userAgent: DEV_USER_AGENT,
        }),
      ),
    );
  }

  const employer = users.get('employer');
  if (employer) {
    await source.getRepository(EmployerProfile).save(
      source.getRepository(EmployerProfile).create({
        userId: employer.id,
        type: 'company',
        responsibleName: employer.displayName,
        contactEmail: employer.email,
        contactPhone: null,
        organizationName: 'Empresa Exemplo Vale',
        segment: 'Tecnologia e serviços',
        description: 'Empresa fictícia para testes do ambiente local.',
        website: 'https://local.vale.test',
        location: 'São Paulo - SP',
        isVerified: true,
      }),
    );
  }

  const candidate = users.get('candidate');
  if (candidate) {
    await source.getRepository(CandidateProfile).save(
      source.getRepository(CandidateProfile).create({
        userId: candidate.id,
        displayName: candidate.displayName,
        pronouns: 'ela/dela',
        headline: 'Pessoa desenvolvedora full-stack',
        bio: 'Perfil fictício para testar busca, candidatura e privacidade.',
        location: 'São Paulo - SP',
        workPreferences: {
          areas: ['Tecnologia'],
          workModes: ['remote', 'hybrid'],
          contractTypes: ['clt', 'pj'],
          availability: 'immediate',
        },
        skills: ['TypeScript', 'React', 'Node.js'],
        experiences: [],
        education: [],
        professionalLinks: [],
        visibility: 'verified_employers',
        isActive: true,
      }),
    );
  }
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('The development database reset only runs with NODE_ENV=development.');
  }

  if (process.env.DEV_DB_RESET_CONFIRM !== 'true') {
    throw new Error('Set DEV_DB_RESET_CONFIRM=true to confirm this destructive reset.');
  }

  await dataSource.initialize();
  try {
    await resetSchema(dataSource);
    await seed(dataSource);
  } finally {
    await dataSource.destroy();
  }

  console.log('Development database reset completed.');
  console.log(`All seeded accounts use password: ${DEV_PASSWORD}`);
  for (const user of seedUsers) {
    console.log(`${user.role}: ${user.email}`);
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
