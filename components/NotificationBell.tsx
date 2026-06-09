"use client";

import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink, Zap, Settings } from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPushStatus, pushSupported, subscribeToPush } from "@/lib/push-client";
import toast from "react-hot-toast";

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(pushSupported());
    getPushStatus().then(setPushEnabled);
  }, [isOpen]);

  const handleEnablePush = async () => {
    if (!userId) return;
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        toast.error("Ative as notificações nas configurações do seu navegador");
        return;
      }
      await subscribeToPush(userId);
      setPushEnabled(true);
      toast.success("Notificações ativadas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao ativar notificações");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors active:scale-90"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
      >
        <Bell
          size={18}
          strokeWidth={2}
          style={{ color: unreadCount > 0 ? "#ff6500" : "var(--color-text-muted)" }}
        />
        {(unreadCount > 0 || !pushEnabled) && (
          <span
            className="absolute right-1.5 top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{
              background: !pushEnabled && unreadCount === 0 ? "#f59e0b" : "#ef4444",
              boxShadow: "0 0 0 2px var(--color-bg)",
            }}
          >
            {unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : "!"}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 z-50 w-80 overflow-hidden rounded-3xl shadow-2xl"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
            >
              <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
                <h3 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Notificações</h3>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold hover:underline"
                      style={{ color: "#ff6500" }}
                    >
                      Ler todas
                    </button>
                  )}
                  <Link
                    href="/configuracoes"
                    onClick={() => setIsOpen(false)}
                    style={{ color: "var(--color-text-dim)" }}
                    className="transition-opacity hover:opacity-70"
                  >
                    <Settings size={16} />
                  </Link>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {!pushEnabled && isSupported && (
                  <div className="m-3 p-4 rounded-2xl" style={{ background: "rgba(255,101,0,0.08)", border: "1px solid rgba(255,101,0,0.2)" }}>
                    <div className="flex items-start gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(255,101,0,0.15)", color: "#ff6500" }}
                      >
                        <Zap size={16} fill="currentColor" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: "var(--color-text)" }}>Ativar Notificações</p>
                        <p className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          Receba lembretes de doses e atualizações importantes.
                        </p>
                        <button
                          onClick={handleEnablePush}
                          className="mt-3 w-full py-2 text-white text-[11px] font-bold rounded-lg active:scale-[0.98] transition-all"
                          style={{ background: "#ff6500", boxShadow: "0 4px 12px rgba(255,101,0,0.3)" }}
                        >
                          Ativar Agora
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: "var(--color-surface-mid)", color: "var(--color-text-dim)" }}
                    >
                      <Bell size={24} />
                    </div>
                    <p className="mt-4 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                      Nenhuma notificação por aqui
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="relative flex gap-3 p-4 transition-colors"
                      style={{ background: !n.read ? "rgba(255,101,0,0.04)" : "transparent" }}
                    >
                      {!n.read && (
                        <div
                          className="absolute left-0 top-0 h-full w-1"
                          style={{ background: "#ff6500", borderRadius: "0 2px 2px 0" }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold line-clamp-1" style={{ color: "var(--color-text)" }}>{n.title}</p>
                        <p className="mt-0.5 text-[12px] leading-snug line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                          {n.body}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-medium" style={{ color: "var(--color-text-dim)" }}>
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                          <div className="flex items-center gap-2">
                            {!n.read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full transition-transform active:scale-75"
                                style={{ background: "rgba(255,101,0,0.12)", color: "#ff6500" }}
                                title="Marcar como lida"
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>
                            )}
                            {n.url && (
                              <Link
                                href={n.url}
                                onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                                className="flex h-6 w-6 items-center justify-center rounded-full transition-transform active:scale-75"
                                style={{ background: "var(--color-surface-mid)", color: "var(--color-text-muted)" }}
                              >
                                <ExternalLink size={14} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>
                    Histórico das últimas 20 notificações
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
