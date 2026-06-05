"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User, Sparkles, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BlurPaywall } from "@/components/BlurPaywall";
import { usePlano } from "@/hooks/usePlano";
import { m, AnimatePresence  } from 'framer-motion';
import { useFabVisibility } from "@/components/FabVisibilityContext";
import dynamic from "next/dynamic";
import { SkeletonText } from "@/components/ui/Skeleton";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <SkeletonText lines={3} />,
  ssr: false,
});

const suggestions = [
  "Quais proteínas comer na janta?",
  "Como evitar a náusea matinal?",
  "Dicas para beber mais água",
  "Posso beber álcool?",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AssistentePage() {
  const { setFabHidden } = useFabVisibility();
  const { isExpirado } = usePlano();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou seu assistente de acompanhamento. Posso ajudar com dúvidas sobre nutrição, bem-estar e como otimizar seus resultados com o Mounjaro. Como posso te ajudar hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFabHidden(true);

    return () => {
      setFabHidden(false);
    };
  }, [setFabHidden]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = response.ok ? await response.json() : null;
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data?.text ||
            "Não consegui gerar uma resposta agora. Tente novamente em instantes.",
        },
      ]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Não consegui conectar ao assistente agora. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col pb-36">
      <PageHeader title="Assistente IA" />

      <BlurPaywall ativo={isExpirado} mensagem="Converse com a IA no Premium">
        <div className="flex flex-col">
          <div className="mb-4 flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 shadow-sm animate-fade-up">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-[11px] font-bold leading-tight text-amber-700">
              As respostas são geradas por IA. SEMPRE siga as orientações do seu médico assistente.
            </p>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border-none bg-white shadow-premium min-h-[50vh]">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <m.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                        message.role === "user" ? "bg-white text-forest" : "bg-forest text-white"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User size={16} strokeWidth={2.5} />
                      ) : (
                        <Bot size={16} strokeWidth={2.5} />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-[18px] px-4 py-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] ${
                        message.role === "user"
                          ? "rounded-tr-none bg-[#1c4d2e] text-white max-w-[80%] self-end"
                          : "rounded-tl-none bg-white border border-[#f0f0f0] text-gray-800"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            h1: ({children}) => <p style={{fontWeight:700, fontSize:15, color:'#111', marginBottom:4}}>{children}</p>,
                            h2: ({children}) => <p style={{fontWeight:700, fontSize:14, color:'#111', marginBottom:4}}>{children}</p>,
                            h3: ({children}) => <p style={{fontWeight:600, fontSize:13, color:'#374151', marginBottom:4}}>{children}</p>,
                            p: ({children}) => <p style={{fontSize:14, color:'#374151', lineHeight:1.65, marginBottom:8}}>{children}</p>,
                            strong: ({children}) => <strong style={{fontWeight:700, color:'#111'}}>{children}</strong>,
                            ul: ({children}) => <ul style={{paddingLeft:0, margin:'6px 0', listStyle:'none'}}>{children}</ul>,
                            ol: ({children}) => <ol style={{paddingLeft:0, margin:'6px 0', listStyle:'none', counterReset:'item'}}>{children}</ol>,
                            li: ({children}) => (
                              <li style={{display:'flex', gap:8, marginBottom:6, fontSize:14, color:'#374151'}}>
                                <span style={{color:'#16a34a', flexShrink:0, marginTop:2}}>•</span>
                                <span>{children}</span>
                              </li>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </m.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-white shadow-sm">
                    <Bot size={16} strokeWidth={2.5} />
                  </div>
                  <div className="rounded-[18px] rounded-tl-none bg-white border border-[#f0f0f0] px-4 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i} 
                          className="h-1.5 w-1.5 rounded-full bg-[#1c4d2e] subtle-bounce" 
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white p-4">
              <div className="mx-auto w-full max-w-md">
              {messages.length <= 1 && !isLoading && (
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="whitespace-nowrap rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-bold text-gray-500 transition-all hover:bg-surface hover:text-forest"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Pergunte qualquer coisa..."
                    className="h-14 w-full rounded-2xl bg-gray-50 pl-5 pr-12 text-sm font-medium transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/10"
                  />
                  <Sparkles className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300" />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-white shadow-lg shadow-forest/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send size={20} strokeWidth={2.5} />
                </button>
              </form>
              </div>
            </div>
          </div>
        </div>
      </BlurPaywall>
    </div>
  );
}
