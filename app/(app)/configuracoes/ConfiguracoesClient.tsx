"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Syringe,
  Salad,
  Bell,
  CalendarClock,
  Package,
  FileBarChart,
  Lightbulb,
  Download,
  Trash2,
  Info,
  FileText,
  ShieldCheck,
  Star,
  LogOut,
  ChevronRight,
  AlertTriangle,
  LayoutDashboard,
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
}

export function ConfiguracoesClient({
  userId,
  email,
  nome,
  cidade,
  estado,
  appVersion,
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

      {/* SEÇÃO 4 — PRIVACIDADE E DADOS */}
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

      {/* SEÇÃO 5 — SOBRE */}
      <section>
        <SectionLabel>Sobre</SectionLabel>
        <Card>
          <InfoRow
            icon={<Info size={20} strokeWidth={2.5} />}
            title="Versão do app"
            value={`v${appVersion}`}
          />
          <Divider />
          <LinkRow
            icon={<FileText size={20} strokeWidth={2.5} />}
            title="Termos de uso"
            href="#"
          />
          <Divider />
          <LinkRow
            icon={<ShieldCheck size={20} strokeWidth={2.5} />}
            title="Política de privacidade"
            href="#"
          />
          <Divider />
          <LinkRow
            icon={<Star size={20} strokeWidth={2.5} />}
            title="Avalie o app"
            href="#"
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

function InfoRow({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex w-full items-center gap-4 p-4">
      <div 
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ember"
        style={{ background: "var(--color-bg)" }}
      >
        {icon}
      </div>
      <h3 className="flex-1 text-sm font-bold text-text">{title}</h3>
      <span className="text-sm font-semibold text-muted">{value}</span>
    </div>
  );
}

function LinkRow({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-full items-center gap-4 p-4 active:bg-surface-mid/50 transition-colors"
    >
      <div 
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ember"
        style={{ background: "var(--color-bg)" }}
      >
        {icon}
      </div>
      <h3 className="flex-1 text-sm font-bold text-text">{title}</h3>
      <ChevronRight className="h-5 w-5 text-dim transition-colors group-hover:text-ember" />
    </a>
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

interface NotifConfig {
  lembrete_dose: boolean;
  dia_semana_dose: number | null;
  horario_dose: string | null;
  alerta_estoque: boolean;
  relatorio_semanal: boolean;
  dicas_dieta: boolean;
}

const DEFAULT_CONFIG: NotifConfig = {
  lembrete_dose: false,
  dia_semana_dose: 1,
  horario_dose: "09:00",
  alerta_estoque: false,
  relatorio_semanal: false,
  dicas_dieta: false,
};

const DIAS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
];

function NotificacoesSection({ userId }: { userId: string }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(pushSupported()); }, []);

  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const [config, setConfig] = useState<NotifConfig>(DEFAULT_CONFIG);
  const [configId, setConfigId] = useState<string | null>(null);

  const [estoqueMin, setEstoqueMin] = useState<number>(2);
  const [alertaId, setAlertaId] = useState<string | null>(null);
  const [alertaAtivo, setAlertaAtivo] = useState(false);

  useEffect(() => {
    getPushStatus().then(setPushOn).catch(() => {});

    (async () => {
      const { data } = await supabase
        .from("configuracoes_notificacao")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setConfigId(data.id);
        setConfig({
          lembrete_dose: data.lembrete_dose ?? false,
          dia_semana_dose: data.dia_semana_dose ?? 1,
          horario_dose: data.horario_dose ? String(data.horario_dose).slice(0, 5) : "09:00",
          alerta_estoque: data.alerta_estoque ?? false,
          relatorio_semanal: data.relatorio_semanal ?? false,
          dicas_dieta: data.dicas_dieta ?? false,
        });
      }

      const { data: alerta } = await supabase
        .from("alertas_estoque")
        .select("id, quantidade_minima, ativo")
        .eq("user_id", userId)
        .maybeSingle();
      if (alerta) {
        setAlertaId(alerta.id);
        setEstoqueMin(alerta.quantidade_minima ?? 2);
        setAlertaAtivo(alerta.ativo ?? false);
      }
    })();
  }, [userId]);

  async function persistConfig(patch: Partial<NotifConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    const payload = {
      lembrete_dose: next.lembrete_dose,
      dia_semana_dose: next.dia_semana_dose,
      horario_dose: next.horario_dose,
      alerta_estoque: next.alerta_estoque,
      relatorio_semanal: next.relatorio_semanal,
      dicas_dieta: next.dicas_dieta,
    };
    if (configId) {
      await supabase.from("configuracoes_notificacao").update(payload).eq("id", configId);
    } else {
      const { data } = await supabase.from("configuracoes_notificacao").insert({ user_id: userId, ...payload }).select("id").single();
      if (data) setConfigId(data.id);
    }
  }

  async function togglePush() {
    if (pushBusy) return;
    if (!supported) {
      toast.error("Para usar notificações, instale o app na tela inicial.");
      return;
    }

    if (!pushOn && typeof Notification !== "undefined") {
      if (Notification.permission === "denied") {
        toast.error("Notificações bloqueadas. Ative nas configurações.");
        return;
      }
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return;
      }
    }

    setPushBusy(true);
    const loadingId = toast.loading(pushOn ? "Desativando..." : "Ativando...");
    try {
      if (pushOn) {
        await unsubscribeFromPush();
        setPushOn(false);
        toast.success("Desativado.");
      } else {
        await subscribeToPush(userId);
        setPushOn(true);
        toast.success("Ativado!");
      }
    } catch (err: any) {
      toast.error("Erro ao alterar notificações.");
    } finally {
      toast.dismiss(loadingId);
      setPushBusy(false);
    }
  }

  async function persistAlerta(patch: { quantidade_minima?: number; ativo?: boolean }) {
    const nextMin = patch.quantidade_minima ?? estoqueMin;
    const nextAtivo = patch.ativo ?? alertaAtivo;
    if (patch.quantidade_minima !== undefined) setEstoqueMin(patch.quantidade_minima);
    if (patch.ativo !== undefined) setAlertaAtivo(patch.ativo);

    if (alertaId) {
      await supabase.from("alertas_estoque").update({ quantidade_minima: nextMin, ativo: nextAtivo }).eq("id", alertaId);
    } else {
      const { data } = await supabase.from("alertas_estoque").insert({ user_id: userId, quantidade_minima: nextMin, ativo: nextAtivo }).select("id").single();
      if (data) setAlertaId(data.id);
    }
  }

  return (
    <Card className="divide-y" style={{ borderColor: "var(--color-surface-border)" }}>
      <ToggleRow
        icon={<Bell size={20} strokeWidth={2.5} />}
        title="Push e Alertas"
        subtitle={supported ? "Notificações no seu dispositivo" : "Instale o app para ativar"}
        enabled={pushOn}
        busy={pushBusy}
        onToggle={togglePush}
      />

      <ToggleRow
        icon={<CalendarClock size={20} strokeWidth={2.5} />}
        title="Lembrete de dose"
        subtitle="Avisa o dia e horário da aplicação"
        enabled={config.lembrete_dose}
        onToggle={() => persistConfig({ lembrete_dose: !config.lembrete_dose })}
        expand={
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Dia da semana
              </label>
              <select
                className="input-standard appearance-none"
                value={String(config.dia_semana_dose ?? 1)}
                onChange={(e) => persistConfig({ dia_semana_dose: Number(e.target.value) })}
              >
                {DIAS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Horário
              </label>
              <input
                type="time"
                className="input-standard"
                value={config.horario_dose ?? "09:00"}
                onChange={(e) => persistConfig({ horario_dose: e.target.value })}
              />
            </div>
          </div>
        }
        expanded={config.lembrete_dose}
      />

      <ToggleRow
        icon={<Package size={20} strokeWidth={2.5} />}
        title="Alerta de estoque"
        subtitle="Avisa quando as ampolas estão acabando"
        enabled={alertaAtivo}
        onToggle={() => persistAlerta({ ativo: !alertaAtivo })}
        expand={
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
              Alertar quando restar
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                inputMode="numeric"
                className="input-standard w-24"
                value={estoqueMin}
                onChange={(e) => persistAlerta({ quantidade_minima: Number(e.target.value) || 1 })}
              />
              <span className="text-sm font-medium text-muted">ampola(s)</span>
            </div>
          </div>
        }
        expanded={alertaAtivo}
      />

      <ToggleRow
        icon={<FileBarChart size={20} strokeWidth={2.5} />}
        title="Relatório semanal"
        subtitle="Receba um resumo toda segunda-feira"
        enabled={config.relatorio_semanal}
        onToggle={() => persistConfig({ relatorio_semanal: !config.relatorio_semanal })}
      />

      <ToggleRow
        icon={<Lightbulb size={20} strokeWidth={2.5} />}
        title="Dicas de dieta"
        subtitle="Dicas personalizadas para sua fase atual"
        enabled={config.dicas_dieta}
        onToggle={() => persistConfig({ dicas_dieta: !config.dicas_dieta })}
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
