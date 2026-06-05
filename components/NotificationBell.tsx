"use client";

import { useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { m, AnimatePresence  } from 'framer-motion';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 active:scale-90"
      >
        <Bell size={20} strokeWidth={2} className={unreadCount > 0 ? "text-forest" : ""} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsOpen(false)}
            />
            <m.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 z-50 w-80 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between border-b border-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-forest hover:underline"
                  >
                    Ler todas
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <Bell size={24} />
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-400">
                      Nenhuma notificação por aqui
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`relative flex gap-3 p-4 transition-colors hover:bg-slate-50 ${
                        !n.read ? "bg-forest/[0.02]" : ""
                      }`}
                    >
                      {!n.read && (
                        <div className="absolute left-0 top-0 h-full w-1 bg-forest" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 line-clamp-1">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500 leading-snug line-clamp-2">
                          {n.body}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            {!n.read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-forest/10 text-forest transition-transform active:scale-75"
                                title="Marcar como lida"
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>
                            )}
                            {n.url && (
                              <Link
                                href={n.url}
                                onClick={() => {
                                  markAsRead(n.id);
                                  setIsOpen(false);
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-transform active:scale-75"
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
                <div className="border-t border-slate-50 p-3 text-center">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     Histórico das últimas 20 notificações
                   </p>
                </div>
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
