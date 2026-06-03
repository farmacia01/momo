"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Package,
  Calendar,
  FileText,
  ShieldCheck,
  LogOut,
  MapPin,
  User,
  Save,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import { pushSupported, getPushStatus, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";

interface Profile {
  id: string;
  nome: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

export function ConfiguracoesClient({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"menu" | "address" | "profile">("menu");

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function updateProfile() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Perfil atualizado!");
      setView("menu");
    } catch (err) {
      toast.error("Erro ao atualizar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader 
        title={view === "menu" ? "Configurações" : view === "address" ? "Endereço" : "Meu Perfil"} 
        showBack={view !== "menu"}
        onBack={() => setView("menu")}
      />

      <AnimatePresence mode="wait">
        {view === "menu" && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Profile Section */}
            <div className="bg-white rounded-[24px] p-5 shadow-premium">
              <button 
                onClick={() => setView("profile")}
                className="w-full flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center text-forest">
                  <User size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-bold text-gray-900">{profile.nome || "Usuário"}</h3>
                  <p className="text-[11px] font-medium text-gray-400">Editar dados pessoais</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-forest transition-colors" />
              </button>
              
              <div className="h-px bg-gray-50 my-4" />

              <button 
                onClick={() => setView("address")}
                className="w-full flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center text-forest">
                  <MapPin size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-bold text-gray-900">Endereço de Entrega</h3>
                  <p className="text-[11px] font-medium text-gray-400">
                    {profile.cidade ? `${profile.cidade}/${profile.estado}` : "Não configurado"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-forest transition-colors" />
              </button>
            </div>

            {/* Notifications */}
            <NotificacoesSection userId={profile.id} />

            {/* Security */}
            <div className="bg-white rounded-[24px] p-5 shadow-premium flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-forest" />
              <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                Seus dados são protegidos com criptografia de ponta a ponta.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} /> Sair da conta
            </button>
          </motion.div>
        )}

        {view === "address" && (
          <motion.div 
            key="address"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[24px] p-6 shadow-premium">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="CEP" 
                  value={profile.cep || ""} 
                  onChange={v => setProfile({...profile, cep: v})} 
                  placeholder="00000-000"
                />
                <Input 
                  label="UF" 
                  value={profile.estado || ""} 
                  onChange={v => setProfile({...profile, estado: v.toUpperCase()})} 
                  maxLength={2}
                />
                <div className="col-span-2">
                  <Input 
                    label="Logradouro" 
                    value={profile.logradouro || ""} 
                    onChange={v => setProfile({...profile, logradouro: v})} 
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <Input 
                  label="Número" 
                  value={profile.numero || ""} 
                  onChange={v => setProfile({...profile, numero: v})} 
                />
                <Input 
                  label="Bairro" 
                  value={profile.bairro || ""} 
                  onChange={v => setProfile({...profile, bairro: v})} 
                />
                <div className="col-span-2">
                  <Input 
                    label="Cidade" 
                    value={profile.cidade || ""} 
                    onChange={v => setProfile({...profile, cidade: v})} 
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    label="Complemento" 
                    value={profile.complemento || ""} 
                    onChange={v => setProfile({...profile, complemento: v})} 
                    placeholder="Apto, Bloco..."
                  />
                </div>
              </div>

              <button 
                onClick={updateProfile}
                disabled={loading}
                className="btn-primary w-full py-4 mt-8 flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : <><Save size={18} /> Salvar Endereço</>}
              </button>
              
              <button 
                onClick={() => setView("menu")}
                className="w-full text-center text-sm font-bold text-gray-400 mt-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {view === "profile" && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[24px] p-6 shadow-premium">
              <Input 
                label="Nome Completo" 
                value={profile.nome || ""} 
                onChange={v => setProfile({...profile, nome: v})} 
              />
              
              <button 
                onClick={updateProfile}
                disabled={loading}
                className="btn-primary w-full py-4 mt-8 flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : <><Save size={18} /> Salvar Alterações</>}
              </button>

              <button 
                onClick={() => setView("menu")}
                className="w-full text-center text-sm font-bold text-gray-400 mt-4 py-2"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NotifConfig {
  lembrete_dose: boolean;
  alerta_estoque: boolean;
  relatorio_semanal: boolean;
  dicas_dieta: boolean;
}

const DEFAULT_CONFIG: NotifConfig = {
  lembrete_dose: true,
  alerta_estoque: true,
  relatorio_semanal: false,
  dicas_dieta: true,
};

function NotificacoesSection({ userId }: { userId: string }) {
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const supported = pushSupported();

  const [config, setConfig] = useState<NotifConfig>(DEFAULT_CONFIG);
  const [configId, setConfigId] = useState<string | null>(null);

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
          lembrete_dose: data.lembrete_dose ?? true,
          alerta_estoque: data.alerta_estoque ?? true,
          relatorio_semanal: data.relatorio_semanal ?? false,
          dicas_dieta: data.dicas_dieta ?? true,
        });
      }
    })();
  }, [userId]);

  async function togglePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushOn) {
        await unsubscribeFromPush();
        setPushOn(false);
        toast.success("Notificações desativadas.");
      } else {
        await subscribeToPush(userId);
        setPushOn(true);
        toast.success("Notificações ativadas!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível alterar as notificações.");
    } finally {
      setPushBusy(false);
    }
  }

  async function updateConfig(key: keyof NotifConfig, value: boolean) {
    const next = { ...config, [key]: value };
    setConfig(next);
    if (configId) {
      await supabase.from("configuracoes_notificacao").update({ [key]: value }).eq("id", configId);
    } else {
      const { data } = await supabase
        .from("configuracoes_notificacao")
        .insert({ user_id: userId, ...next })
        .select("id")
        .single();
      if (data) setConfigId(data.id);
    }
  }

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-premium">
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Notificações</h3>
      <div className="space-y-4">
        <Toggle
          icon={<Bell size={18} />}
          title="Push e Alertas"
          subtitle={supported ? undefined : "Não suportado neste navegador"}
          enabled={pushOn}
          busy={pushBusy}
          disabled={!supported}
          onToggle={togglePush}
        />
        <div className="h-px bg-gray-50" />
        <Toggle icon={<Calendar size={18} />} title="Lembrete de dose" enabled={config.lembrete_dose} onToggle={() => updateConfig("lembrete_dose", !config.lembrete_dose)} />
        <Toggle icon={<Package size={18} />} title="Alerta de estoque" enabled={config.alerta_estoque} onToggle={() => updateConfig("alerta_estoque", !config.alerta_estoque)} />
        <Toggle icon={<FileText size={18} />} title="Relatório semanal" enabled={config.relatorio_semanal} onToggle={() => updateConfig("relatorio_semanal", !config.relatorio_semanal)} />
        <Toggle icon={<Bell size={18} />} title="Dicas de dieta" enabled={config.dicas_dieta} onToggle={() => updateConfig("dicas_dieta", !config.dicas_dieta)} />
      </div>
    </div>
  );
}

function Toggle({
  icon,
  title,
  subtitle,
  enabled,
  busy,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  enabled: boolean;
  busy?: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`flex items-center gap-4 ${disabled ? "opacity-50" : ""}`}>
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        {subtitle && <p className="text-[11px] font-medium text-gray-400">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled || busy}
        aria-label={title}
        className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? "bg-forest" : "bg-gray-200"} ${disabled || busy ? "cursor-not-allowed" : ""}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, maxLength }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, maxLength?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">{label}</label>
      <input 
        className="input-standard bg-gray-50"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}
