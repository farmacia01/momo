"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, AlertCircle, ChevronLeft } from "lucide-react";
import { PaywallCard } from "@/components/PaywallCard";
import { usePlano } from "@/hooks/usePlano";
import { m, AnimatePresence } from "framer-motion";
import { useFabVisibility } from "@/components/FabVisibilityContext";
import dynamic from "next/dynamic";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";

// Dynamic import to prevent hydration issues with markdown
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <SkeletonText lines={3} />,
  ssr: false,
});

const suggestions = [
  "Quanto peso perdi esta semana?",
  "Qual o melhor app pra quem usa Mounjaro?",
  "Como evitar náusea matinal?",
  "Quais proteínas comer na janta?",
  "Qual meu peso atual?",
  "Dicas para beber mais água",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AssistentePage() {
  const { setFabHidden } = useFabVisibility();
  const { isExpirado } = usePlano();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou a Momo, sua assistente de saúde personalizada. Conheço seus dados — posso responder coisas como \"quanto perdi desde o dia 8?\" ou \"qual meu IMC atual?\". Também ajudo com nutrição, efeitos colaterais e tudo sobre o Mounjaro. Me pergunte o que quiser! 💬",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFabHidden(true);
    return () => setFabHidden(false);
  }, [setFabHidden]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = res.ok ? await res.json() : null;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data?.text || "Não consegui gerar uma resposta agora. Tente novamente.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Não consegui conectar. Tente novamente." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  if (isExpirado) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col pb-36">
        <ChatHeader onBack={() => router.back()} />
        <div className="mt-6">
          <PaywallCard
            recurso="Assistente IA Premium"
            descricao="Assine para conversar com o assistente sem limite de perguntas."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative" style={{ height: "calc(100svh - 110px)" }}>
      {/* Header estilo WhatsApp - fixo no topo da área do chat */}
      <div className="sticky top-0 z-[40] bg-bg/95 backdrop-blur-md pb-2">
        <ChatHeader onBack={() => router.back()} />
        
        {/* Aviso médico */}
        <div
          className="mx-0 flex gap-2.5 rounded-2xl px-3.5 py-2"
          style={{ background: "var(--color-ember-glow)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <p className="text-[10px] font-semibold leading-tight text-warning opacity-90">
            Respostas geradas por IA — siga sempre seu médico.
          </p>
        </div>
      </div>

      {/* Área de mensagens */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth pt-4 pb-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-surface-border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="space-y-3 px-1">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <m.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar IA */}
                {msg.role === "assistant" && (
                  <div
                    className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-ember"
                    style={{
                      background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))",
                    }}
                  >
                    <Bot size={13} strokeWidth={2.5} color="white" />
                  </div>
                )}

                {/* Bolha */}
                <div
                  className={`relative max-w-[85%] px-4 py-3 shadow-card ${msg.role === "user" ? "text-white" : "text-text"}`}
                  style={
                    msg.role === "user"
                      ? {
                          background: "linear-gradient(135deg, var(--color-ember) 0%, var(--color-ember-dim) 100%)",
                          borderRadius: "20px 20px 5px 20px",
                          boxShadow: "var(--shadow-ember)",
                        }
                      : {
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-surface-border)",
                          borderRadius: "20px 20px 20px 5px",
                        }
                  }
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-chat prose prose-sm max-w-none prose-p:leading-relaxed prose-p:m-0">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }: any) => <p className="font-bold text-[15px] mb-1 text-text">{children}</p>,
                          p: ({ children }: any) => <p className="text-[14px] leading-relaxed mb-1 text-text">{children}</p>,
                          li: ({ children }: any) => <li className="flex gap-2 text-[14px] mb-1 text-text"><span className="text-ember shrink-0">•</span>{children}</li>,
                          ul: ({ children }: any) => <ul className="list-none p-0 m-0">{children}</ul>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[14px] font-medium leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </m.div>
            ))}
          </AnimatePresence>

          {/* Digitando... */}
          {isLoading && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2"
            >
              <div
                className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-ember"
                style={{
                  background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))",
                }}
              >
                <Bot size={13} strokeWidth={2.5} color="white" />
              </div>
              <div
                className="px-4 py-3 shadow-card"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-surface-border)",
                  borderRadius: "20px 20px 20px 5px",
                }}
              >
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full subtle-bounce"
                      style={{ background: "var(--color-ember)", animationDelay: `${i * 0.18}s`, opacity: 0.8 }}
                    />
                  ))}
                </div>
              </div>
            </m.div>
          )}
        </div>
      </div>

      {/* Input fixo */}
      <div
        className="fixed bottom-[80px] left-0 right-0"
        style={{
          background: "linear-gradient(to top, var(--color-bg) 95%, transparent)",
          paddingTop: 20,
          paddingBottom: 4,
          zIndex: "var(--z-nav)",
        }}
      >
        <div className="mx-auto w-full max-w-md px-4">
          {/* Sugestões */}
          {messages.length <= 1 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all active:scale-95 border border-ember/20"
                  style={{
                    background: "var(--color-ember-glow)",
                    color: "var(--color-ember)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="h-12 flex-1 rounded-full px-5 text-[14px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ember/20 shadow-sm border border-surface-border"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-95 disabled:opacity-40 shadow-ember border border-surface-border"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))"
                  : "var(--color-surface-mid)",
              }}
            >
              <Send
                size={18}
                strokeWidth={2.5}
                style={{ color: input.trim() ? "white" : "var(--color-text-dim)" }}
              />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChatHeader({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="mb-2 flex items-center gap-3 rounded-[24px] px-4 py-3"
      style={{
        background: "linear-gradient(135deg, #1a0800 0%, #2d1200 60%, #1a0800 100%)",
        boxShadow: "0 4px 20px rgba(255,101,0,0.18)",
      }}
    >
      <button
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <ChevronLeft size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
      </button>

      <div className="relative">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "rgba(255,101,0,0.2)", border: "2px solid rgba(255,101,0,0.45)" }}
        >
          <Bot size={20} strokeWidth={2} color="var(--color-ember)" />
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
          style={{ background: "var(--color-success)", border: "2px solid #1a0800", boxShadow: "0 0 6px var(--color-success)" }}
        />
      </div>

      <div className="flex-1">
        <p className="text-[15px] font-bold leading-tight text-white">Assistente Momo</p>
        <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
          IA Nutricional
        </p>
      </div>

      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{ background: "rgba(34,197,94,0.15)" }}
      >
        <div
          className="h-1.5 w-1.5 rounded-full bg-success"
          style={{ boxShadow: "0 0 5px var(--color-success)" }}
        />
        <span className="text-[10px] font-bold text-success">Online</span>
      </div>
    </div>
  );
}
