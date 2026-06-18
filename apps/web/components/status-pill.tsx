type StatusPillProps = {
  children: React.ReactNode;
  tone: 'ready' | 'neutral';
};

export function StatusPill({ children, tone }: StatusPillProps) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
