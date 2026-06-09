"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 ml-4 text-[11px] font-bold uppercase tracking-widest text-muted">
      {children}
    </h2>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card overflow-hidden ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Divider() {
  return <div className="mx-4 h-px" style={{ background: "var(--color-surface-border)" }} />;
}

export function SaveButton({
  children,
  onClick,
  busy,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <SubmitButton onClick={onClick} busy={busy} disabled={disabled}>
      {children}
    </SubmitButton>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="ml-1 text-[11px] font-medium text-dim">{hint}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  inputMode,
  maxLength,
}: {
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      className={`input-standard ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      inputMode={inputMode}
      maxLength={maxLength}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        className="input-standard appearance-none pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && (
          <option value="" disabled className="bg-surface text-muted">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-text">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export function SubmitButton({
  children,
  onClick,
  busy,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className="btn-primary w-full"
    >
      {busy ? <LoadingSpinner size="sm" /> : children}
    </button>
  );
}
