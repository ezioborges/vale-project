import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('rate_limit_counters')
export class RateLimitCounter {
  @PrimaryColumn({ type: 'text' })
  key!: string;

  @Column({ type: 'integer' })
  hits!: number;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
