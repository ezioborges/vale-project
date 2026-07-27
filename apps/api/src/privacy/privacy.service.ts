import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PrivacySummary } from '@vale/shared';

import { Env } from '../common/config/env.validation';

@Injectable()
export class PrivacyService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  summary(): PrivacySummary {
    return {
      account: {
        correctionPath: '/app/conta',
        exportAvailable: this.configService.get('PRIVACY_EXPORT_ENABLED', {
          infer: true,
        }),
        deletionAvailable: this.configService.get('ACCOUNT_DELETION_ENABLED', {
          infer: true,
        }),
        optionalConsentAvailable: false,
      },
      processing: [
        {
          category: 'Conta e autenticação',
          purpose: 'Acesso seguro à conta e prevenção de abuso.',
          status: 'pending_approval',
        },
        {
          category: 'Perfil, vagas e candidaturas',
          purpose: 'Intermediação de oportunidades e processos autorizados.',
          status: 'pending_approval',
        },
        {
          category: 'Segurança e moderação',
          purpose:
            'Prevenção de fraude, investigação e integridade do serviço.',
          status: 'pending_approval',
        },
      ],
      assistedChannel: { status: 'pending_approval' },
    };
  }
}
