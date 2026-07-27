# Schema de exportação — rascunho versionado

Status: `PENDENTE_APROVACAO` (D-02, D-03 e D-06). Não usar para exportar dados reais ainda.

O pacote futuro terá `manifest.json` com versão do schema, momento de corte, categorias, finalidade,
retenção aprovada e hashes dos arquivos. Fragmentos serão allowlists por domínio, nunca `SELECT *`.

Proibidos em qualquer versão: `passwordHash`, hashes ou valores de tokens, cookies, segredos, chaves,
IP/user-agent sem decisão expressa, URLs permanentes, chaves de storage, dados de outros candidatos,
denunciantes, notas internas e payload da outbox. O arquivo completo ficará em storage privado e não
será anexado a e-mail.
