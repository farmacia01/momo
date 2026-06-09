import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="text-center p-8 rounded-xl"
      style={{ background: "var(--color-surface)", border: "1px dashed var(--color-surface-border)" }}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4"
        style={{ background: "var(--color-surface-mid)", color: "var(--color-text-dim)" }}
      >
        {icon}
      </div>
      <h3 className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>{title}</h3>
      <p className="mt-1 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
