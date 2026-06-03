import { AppShell } from "@/components/AppShell";

/**
 * Layout for the authenticated area of the app. Everything under the (app)
 * route group is wrapped in the navigation shell (sidebar + mobile drawer).
 * Route protection itself is handled in middleware.ts.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
