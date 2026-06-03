import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotificationBell } from "./NotificationBell";

/**
 * Standard page header: greeting + today's date on the left, avatar + bell on
 * the right. Transparent background (no card).
 */
export function AppHeader({
  userId,
  name,
  subtitle,
  initials,
  avatarUrl,
}: {
  userId?: string;
  name: string;
  /** Defaults to today's date in pt-BR. */
  subtitle?: string;
  /** Fallback avatar when there's no image. */
  initials?: string;
  avatarUrl?: string;
}) {
  const date =
    subtitle ?? format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const fallback =
    initials ?? (name.trim().slice(0, 2).toUpperCase() || "MT");

  return (
    <header className="flex items-center justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-bold tracking-tight text-[#111827]">
          Olá, {name}!
        </h1>
        <p className="mt-0.5 text-[13px] font-medium capitalize text-[#6b7280]">
          {date}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell userId={userId} />
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d1ead9] text-sm font-bold text-[#1a5c38]">
            {fallback}
          </div>
        )}
      </div>
    </header>
  );
}
