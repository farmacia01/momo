"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Syringe,
  Salad,
  Bell,
  Download,
  Trash2,
  Star,
  LogOut,
  ChevronRight,
  AlertTriangle,
  LayoutDashboard,
  Gift,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  pushSupported,
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";
import { exportarDadosCsv } from "@/lib/export-dados";
import { SectionLabel, Card, Divider } from "./ui";

interface Props {
  userId: string;
  email: string;
  nome: string | null;
  cidade: string | null;
  estado: string | null;
  doseMg: number | null;
  appVersion: string;
  referralCode: string;
  inviteCount: number;
}

export function ConfiguracoesClient({
  userId,
  email,
  nome,
  cidade,
  estado,
  appVersion,
  referralCode,
  inviteCount,
}: Props) {
  const router = useRouter();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Configurações" showBack={false} />

      {/* SEÇÃO 1 — MINHA CONTA */}
      <section>
        <SectionLabel>Minha Conta</SectionLabel>
        <Card>
          <NavItem
            icon={<User size={20} strokeWidth={2.5} />}
            title={nome || "Usuário"}
            subtitle="Dados pessoais e senha"
            onClick={() => router.push("/configuracoes/usuario")}
          />
          <Divider />
          <NavItem
            icon={<MapPin size={20} strokeWidth={2.5} />}
            title="Endereço de Entrega"
            subtitle={cidade ? `${cidade}${estado ? `/${estado}` : ""}` : "Não configurado"}
            onClick={() => router.push("/configuracoes/endereco")}
          />
          <Divider />
          <NavItem
            icon={<Star size={20} strokeWidth={2.5} />}
            title="Meu Plano"
            subtitle="Gerenciar assinatura"
            onClick={() => router.push("/configuracoes/plano")}
          />
        </Card>
      </section>

      {/* SEÇÃO 2 — MEU TRATAMENTO */}
      <section>
        <SectionLabel>Meu Tratamento</SectionLabel>
        <Card>
          <NavItem
            icon={<Syringe size={20} strokeWidth={2.5} />}
            title="Dados do tratamento"
            subtitle="Dose, médico e metas de peso"
            onClick={() => router.push("/configuracoes/tratamento")}
          />
          <Divider />
          <NavItem
            icon={<Salad size={20} strokeWidth={2.5} />}
            title="Restrições alimentares"
            subtitle="Personalize suas receitas"
            onClick={() => router.push("/configuracoes/restricoes")}
          />
        </Card>
      </section>

      {/* SEÇÃO 3 — NOTIFICAÇÕES */}
      <section>
        <SectionLabel>Notificações</SectionLabel>
        <NotificacoesSection userId={userId} />
      </section>

      {/* SEÇÃO 4 — CONVITES */}
      <section>
        <SectionLabel>Convites</SectionLabel>
        <ConvitesSection referralCode={referralCode} inviteCount={inviteCount} />
      </section>

      {/* SEÇÃO 5 — PRIVACIDADE E DADOS */}
      <section>
        <SectionLabel>Privacidade e Dados</SectionLabel>
        <Card>
          <ExportItem userId={userId} />
          <Divider />
          <NavItem
            icon={<Trash2 size={20} strokeWidth={2.5} />}
            iconClassName="text-red-500"
            title="Excluir minha conta"
            titleClassName="text-red-500"
            subtitle="Apaga permanentemente seus dados"
            onClick={() => setDeleteOpen(true)}
            hideChevron
          />
        </Card>
      </section>

      {/* SEÇÃO ADMIN — visível apenas para o dono */}
      {email === "ryan@gmail.com" && (
        <section>
          <SectionLabel>Admin</SectionLabel>
          <Card>
            <NavItem
              icon={<LayoutDashboard size={20} strokeWidth={2.5} />}
              iconClassName="text-red-500"
              title="Painel Administrativo"
              subtitle="Usuários, fornecedores, financeiro"
              onClick={() => router.push("/admin")}
            />
          </Card>
        </section>
      )}

      {/* SAIR DA CONTA */}
      <button
        onClick={() => setSignOutOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-red-500 transition-colors hover:bg-red-50/10"
      >
        <LogOut size={18} /> Sair da conta
      </button>

      {signOutOpen && <SignOutModal onClose={() => setSignOutOpen(false)} />}
      {deleteOpen && (
        <DeleteAccountModal email={email} onClose={() => setDeleteOpen(false)} />
      )}
    </div>
  );
}

/* ---------- Convites ---------- */

function ConvitesSection({ referralCode, inviteCount }: { referralCode: string; inviteCount: number }) {
  const [copied, setCopied] = useState(false);
  const diasBonus = inviteCount * 5;
  const inviteUrl = `https://www.usemomo.online/convite/${referralCode}`;
  const shareMessage = `Estou usando o Momo para acompanhar meu tratamento com Mounjaro — dose, peso, dieta e tudo mais. É gratuito! Entre pelo meu link: ${inviteUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Momo", text: shareMessage, url: inviteUrl });
        return;
      } catch {}
    }
    await copyToClipboard();
  };

  return (
    <div className="space-y-3">
      {/* Contador de dias */}
      <Card>
        <div className="flex items-center gap-4 p-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ember"
            style={{ background: "var(--color-bg)" }}
          >
            <Gift size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-text">
              {diasBonus > 0 ? `+${diasBonus} dias de bônus` : "Ganhe dias de bônus"}
            </h3>
            <p className="text-[11px] font-medium text-muted">
              {inviteCount === 0
                ? "Cada amigo convidado = +5 dias de app"
                : `${inviteCount} ${inviteCount === 1 ? "amigo convidado" : "amigos convidados"} · +5 dias cada`}
            </p>
          </div>
          {diasBonus > 0 && (
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: "var(--color-ember)" }}
            >
              +{diasBonus}d
            </span>
          )}
        </div>
      </Card>

      {/* Link de convite */}
      <Card>
        <div className="p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Seu link de convite</p>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-surface-border)" }}
          >
            <span className="flex-1 truncate text-sm text-muted">
              usemomo.online/convite/
              <strong className="text-ember">{referralCode || "—"}</strong>
            </span>
            <button
              onClick={copyToClipboard}
              className="shrink-0 rounded-lg p-1.5 transition-colors"
              style={{ color: copied ? "var(--color-ember)" : "var(--color-text-dim)" }}
              aria-label="Copiar link"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <button
            onClick={handleShare}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: "var(--color-ember)", boxShadow: "var(--shadow-ember)" }}
          >
            <Share2 size={16} />
            Compartilhar link
          </button>
          <p className="text-center text-[11px] text-muted">
            O convite só conta quando seu amigo criar a conta pelo seu link
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Menu rows ---------- */

function NavItem({
  icon,
  title,
  subtitle,
  onClick,
  iconClassName = "text-ember",
  titleClassName = "text-text",
  hideChevron,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  iconClassName?: string;
  titleClassName?: string;
  hideChevron?: boolean;
}) {
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-4 p-4 text-left active:bg-surface-mid/50 transition-colors">
      <div 
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        style={{ background: "var(--color-bg)" }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className={`text-sm font-bold ${titleClassName}`}>{title}</h3>
        {subtitle && <p className="text-[11px] font-medium text-muted">{subtitle}</p>}
      </div>
      {!hideChevron && (
        <ChevronRight className="h-5 w-5 text-dim transition-colors group-hover:text-ember" />
      )}
    </button>
  );
}

/* ---------- Export data ---------- */

function ExportItem({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    try {
      await exportarDadosCsv(userId);
      toast.success("Download iniciado!");
    } catch {
      toast.error("Não foi possível exportar os dados.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="group flex w-full items-center gap-4 p-4 text-left active:bg-surface-mid/50 transition-colors"
    >
      <div 
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ember"
        style={{ background: "var(--color-bg)" }}
      >
        {busy ? <LoadingSpinner size="sm" /> : <Download size={20} strokeWidth={2.5} />}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-text">Exportar meus dados</h3>
        <p className="text-[11px] font-medium text-muted">
          Baixe um CSV com doses, medições e sintomas
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-dim transition-colors group-hover:text-ember" />
    </button>
  );
}

/* ---------- Notifications ---------- */

function NotificacoesSection({ userId }: { userId: string }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(pushSupported()); }, []);

  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    getPushStatus().then(setPushOn).catch(() => {});
  }, []);

  async function togglePush() {
    if (pushBusy) return;
    if (!supported) {
      toast.error("Para usar notificações, instale o app na tela inicial.");
      return;
    }

    if (!pushOn && typeof Notification !== "undefined") {
      if (Notification.permission === "denied") {
        toast.error("Notificações bloqueadas. Ative nas configurações do dispositivo.");
        return;
      }
    }

    setPushBusy(true);
    const loadingId = toast.loading(pushOn ? "Desativando..." : "Ativando...");
    try {
      if (pushOn) {
        await unsubscribeFromPush(userId);
        setPushOn(false);
        toast.success("Notificações desativadas.");
      } else {
        await subscribeToPush(userId);
        setPushOn(true);
        toast.success("Notificações ativadas!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar notificações.");
    } finally {
      toast.dismiss(loadingId);
      setPushBusy(false);
    }
  }

  return (
    <Card style={{ borderColor: "var(--color-surface-border)" }}>
      <ToggleRow
        icon={<Bell size={20} strokeWidth={2.5} />}
        title="Push e Alertas"
        subtitle={supported ? "Lembretes de dose, peso e estoque" : "Instale o app para ativar"}
        enabled={pushOn}
        busy={pushBusy}
        onToggle={togglePush}
      />
    </Card>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  enabled,
  busy,
  disabled,
  onToggle,
  expand,
  expanded,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  enabled: boolean;
  busy?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  expand?: React.ReactNode;
  expanded?: boolean;
}) {
  const expandRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`transition-colors ${disabled ? "opacity-50" : "active:bg-surface-mid/50"}`} style={{ borderBottomColor: "var(--color-surface-border)" }}>
      <div 
        className={`flex items-center gap-4 p-4 cursor-pointer ${disabled || busy ? "cursor-not-allowed" : ""}`}
        onClick={() => !(disabled || busy) && onToggle()}
      >
        <div 
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ember"
          style={{ background: "var(--color-bg)" }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-text">{title}</p>
          {subtitle && <p className="text-[11px] font-medium text-muted">{subtitle}</p>}
        </div>
        <div
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-ember" : "bg-dim/20"
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform ${
              enabled ? "translate-x-5" : ""
            }`}
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/5">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      </div>

      {expand && (
        <div
          ref={expandRef}
          style={{
            maxHeight: expanded ? (expandRef.current?.scrollHeight ?? 300) + 24 : 0,
          }}
          className="overflow-hidden transition-all duration-300 ease-in-out"
        >
          <div className="px-4 pb-6 pl-[60px]">{expand}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- Modals ---------- */

function SignOutModal({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    } catch {
      toast.error("Erro ao sair.");
      setBusy(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <LogOut size={26} />
      </div>
      <h3 className="text-center text-lg font-bold text-text">Tem certeza que quer sair?</h3>
      <p className="mt-1 text-center text-sm text-muted">
        Você precisará entrar novamente para acessar sua conta.
      </p>
      <div className="mt-6 space-y-3">
        <button
          onClick={handleSignOut}
          disabled={busy}
          className="w-full rounded-full bg-red-500 py-4 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          {busy ? "Saindo..." : "Sair da conta"}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="w-full rounded-full py-3 text-sm font-bold text-muted"
        >
          Cancelar
        </button>
      </div>
    </ModalShell>
  );
}

function DeleteAccountModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const canDelete = confirm.trim() === "DELETE";

  async function handleDelete() {
    if (!canDelete || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/conta/excluir", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao excluir conta.");
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir conta.");
      setBusy(false);
    }
  }

  return (
    <ModalShell onClose={busy ? undefined : onClose}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <AlertTriangle size={26} />
      </div>
      <h3 className="text-center text-lg font-bold text-red-500">Excluir minha conta</h3>
      <p className="mt-2 text-center text-sm font-medium text-red-400">
        Esta ação é permanente. Todos os seus dados ({email}) serão apagados.
      </p>

      <div className="mt-5 space-y-1.5">
        <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-dim">
          Digite DELETE para confirmar
        </label>
        <input
          className="input-standard text-center font-bold tracking-widest"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          autoFocus
        />
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleDelete}
          disabled={!canDelete || busy}
          className="w-full rounded-full bg-red-500 py-4 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-40"
        >
          {busy ? "Excluindo..." : "Excluir permanentemente"}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="w-full rounded-full py-3 text-sm font-bold text-muted"
        >
          Cancelar
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] p-6 shadow-2xl animate-fade-up"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
