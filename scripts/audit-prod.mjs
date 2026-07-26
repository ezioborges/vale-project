import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = resolve(
  root,
  process.env.AUDIT_OUTPUT_DIR ?? '.data/audit',
);
const exceptionsPath = resolve(
  root,
  process.env.AUDIT_EXCEPTIONS_FILE ?? 'security/audit-exceptions.json',
);

await mkdir(outputDirectory, { recursive: true });

const auditProcess = await runAudit();
const rawAudit = auditProcess.stdout.trim();
const rawPath = resolve(outputDirectory, 'audit.json');
await writeFile(rawPath, `${rawAudit}\n`, 'utf8');

let report;
try {
  report = JSON.parse(rawAudit);
} catch {
  await writeFile(
    resolve(outputDirectory, 'audit.raw.txt'),
    `${auditProcess.stdout}${auditProcess.stderr}`,
    'utf8',
  );
  console.error(
    'pnpm audit did not return JSON. The registry or audit command failed.',
  );
  process.exitCode = 1;
  process.exit();
}

const exceptions = await readExceptions();
const advisories = Object.entries(report.advisories ?? {}).map(
  ([advisory, value]) => ({
    advisory: value.github_advisory_id ?? value.cves?.[0] ?? advisory,
    auditId: advisory,
    package: value.module_name,
    severity: value.severity,
    recommendation: value.recommendation ?? '',
    findings: value.findings ?? [],
  }),
);
const blocking = [];
const accepted = [];

for (const item of advisories) {
  if (!['critical', 'high'].includes(item.severity)) {
    continue;
  }

  const exception = exceptions.find(
    (candidate) => candidate.advisory === item.advisory,
  );
  const reason = validateException(exception, item);
  if (reason) {
    blocking.push({ ...item, reason });
  } else {
    accepted.push({ advisory: item.advisory, package: item.package });
  }
}

const vulnerabilityLines =
  advisories.length === 0
    ? ['No advisories returned.']
    : advisories.map((item) => {
        const exception = exceptions.find(
          (candidate) => candidate.advisory === item.advisory,
        );
        const state = ['critical', 'high'].includes(item.severity)
          ? validateException(exception, item)
            ? 'BLOCKED'
            : 'ACCEPTED_EXCEPTION'
          : 'OBSERVED';
        const finding = item.findings[0];
        return `- ${state}: ${item.advisory} ${item.package} (${item.severity}) ${finding?.version ?? 'unknown'} at ${finding?.paths?.[0] ?? 'unknown'}${item.recommendation ? ` — ${item.recommendation}` : ''}`;
      });

const summary = [
  '# Production dependency audit',
  '',
  `Generated at: ${new Date().toISOString()}`,
  `Audit command exit code: ${auditProcess.exitCode ?? 'unknown'}`,
  `Lockfile SHA-256: ${await sha256(resolve(root, 'pnpm-lock.yaml'))}`,
  `Policy result: ${blocking.length === 0 ? 'PASS' : 'FAIL'}`,
  '',
  '## Vulnerabilities',
  '',
  ...vulnerabilityLines,
  '',
  `Blocking high/critical advisories: ${blocking.length}`,
  `Valid accepted exceptions: ${accepted.length}`,
].join('\n');
await writeFile(resolve(outputDirectory, 'audit-summary.md'), `${summary}\n`);
console.log(summary);

if (blocking.length > 0) {
  process.exitCode = 1;
}

async function runAudit() {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  return new Promise((resolveResult) => {
    const child = spawn(command, ['audit', '--prod', '--json'], {
      cwd: root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (exitCode, signal) =>
      resolveResult({
        stdout,
        stderr,
        exitCode,
        signal,
      }),
    );
    child.on('error', (error) =>
      resolveResult({
        stdout,
        stderr: `${stderr}${error.message}`,
        exitCode: 1,
        signal: null,
      }),
    );
  });
}

async function readExceptions() {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(exceptionsPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${exceptionsPath}: ${error.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('The audit exception registry must be an array.');
  }

  return parsed;
}

function validateException(exception, advisory) {
  if (!exception) {
    return 'no current exception is registered';
  }

  const required = [
    'advisory',
    'package',
    'version',
    'path',
    'severity',
    'reach',
    'mitigation',
    'responsible',
    'tracking',
    'expiresAt',
  ];
  const incomplete = required.find(
    (field) => typeof exception[field] !== 'string' || !exception[field].trim(),
  );
  if (incomplete) {
    return `exception is missing ${incomplete}`;
  }

  const expiresAt = new Date(exception.expiresAt);
  const now = new Date();
  const maximum = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt <= now ||
    expiresAt > maximum
  ) {
    return 'exception is expired or exceeds the 30-day validity window';
  }

  const findingMatches = advisory.findings.some(
    (finding) =>
      finding.version === exception.version &&
      finding.paths?.includes(exception.path),
  );
  if (
    exception.advisory !== advisory.advisory ||
    exception.package !== advisory.package ||
    exception.severity !== advisory.severity ||
    !findingMatches
  ) {
    return 'exception does not match the current advisory graph';
  }

  return null;
}

async function sha256(path) {
  const content = await readFile(path);
  return createHash('sha256').update(content).digest('hex');
}
