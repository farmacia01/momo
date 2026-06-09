"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  action,
  showBack = true,
  onBack,
}: {
  title: string;
  action?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="relative mb-6 flex items-center justify-between min-h-[40px]">
      <div className="flex w-10 items-center">
        {showBack && (
          <button
            onClick={() => (onBack ? onBack() : router.back())}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
            style={{ 
              background: "var(--color-surface)", 
              color: "var(--color-text-muted)", 
              border: "1px solid var(--color-surface-border)" 
            }}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-text whitespace-nowrap">
        {title}
      </h1>

      <div className="flex w-10 items-center justify-end">
        {action}
      </div>
    </div>
  );
}
