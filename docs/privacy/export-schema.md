# Schema de exportação do titular

Versão proposta: `1.0-draft`; ativação bloqueada por D-02 e D-06.

O pacote usa allowlists explícitas. O `manifest.json` deve registrar a versão, instante de corte,
controlador/canal aprovados, categorias incluídas, critérios/retenção aprovados e hashes dos
arquivos. Fragmentos planejados: `account.json`, `terms.json`, `candidate-profile.json`,
`employer-profile.json`, `assets.json`, `jobs.json`, `applications.json` e `reports.json`.

Nunca incluir: hashes/valores de token, `passwordHash`, segredo CSRF, chaves de idempotência,
credenciais/configurações, URLs permanentes, chave de storage, IP/user-agent sem decisão expressa,
dados de outro candidato, investigação/denunciante de terceiro ou notas internas.

Cada contributor valida seu DTO contra um schema compartilhado antes de o arquivo ser escrito. Um
teste negativo com campos proibidos e outro usuário é obrigatório antes da liberação.
