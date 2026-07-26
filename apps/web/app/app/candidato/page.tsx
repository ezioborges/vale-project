import Link from 'next/link';

import { CandidateProfileForm } from '@/components/candidate-profile-form';

export default function CandidateHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Área do candidato">
          <Link href="/vagas">Buscar vagas</Link>
          <Link href="/app/candidato/candidaturas">Candidaturas</Link>
          <Link href="/app/candidato/denuncias">Denúncias</Link>
          <Link href="/app/candidato">Meu perfil</Link>
        </nav>
      </header>
      <CandidateProfileForm />
    </main>
  );
}
