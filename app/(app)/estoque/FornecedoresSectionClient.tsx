"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Store, 
  Building2, 
  Bike, 
  Clock, 
  Star 
} from "lucide-react";
import { Stars } from "@/components/Stars";
import {
  nomeFornecedor,
  formatBRL,
  TIPO_FORNECEDOR_LABEL,
} from "@/lib/fornecedores";
import { motion, AnimatePresence } from "framer-motion";

export function FornecedoresSectionClient({ 
  fornecedores, 
  cidade,
  estado 
}: { 
  fornecedores: any[], 
  cidade: string | null,
  estado: string | null 
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");

  const filters = [
    { label: "Todos", icon: null },
    { label: "🏍 Frete Full", key: "oferece_frete_full" },
    { label: "COD", key: "aceita_cod" },
    { label: "⭐ 4.5+", key: "rating" },
  ];

  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter((f) => {
      const matchSearch = (f.nome_fantasia || f.razao_social || "").toLowerCase().includes(search.toLowerCase());
      
      let matchFilter = true;
      if (activeFilter === "🏍 Frete Full") matchFilter = f.oferece_frete_full;
      if (activeFilter === "COD") matchFilter = f.aceita_cod;
      if (activeFilter === "⭐ 4.5+") matchFilter = (f.avaliacao_media || 0) >= 4.5;

      return matchSearch && matchFilter;
    });
  }, [fornecedores, search, activeFilter]);

  return (
    <div className="space-y-6 -mx-6 px-6">
      {/* Hero Header */}
      <div className="relative -mx-6 px-6 pt-8 pb-12 rounded-b-[40px] shadow-lg" style={{ background: "linear-gradient(135deg, #1a0800, #2d1200)", boxShadow: "0 8px 32px rgba(255,101,0,0.18)" }}>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60">Comprar ampolas</p>
          <h2 className="text-2xl font-black text-white">Fornecedores</h2>
          <p className="text-xs font-medium text-white/50">Entrega rápida na sua região</p>
        </div>

        {/* Search Bar Overlay */}
        <div className="absolute left-6 right-6 -bottom-6">
          <div className="bg-surface border border-surface-border shadow-xl rounded-2xl flex items-center gap-3 px-4 py-3.5 transition-all focus-within:ring-2 focus-within:ring-ember/20">
            <Search size={18} className="text-dim" />
            <input 
              type="text"
              placeholder="Buscar farmácia ou produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-text placeholder:text-dim focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-6" />

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(f.label)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === f.label 
                ? "bg-ember text-white shadow-md shadow-ember/20"
                : "bg-surface border border-surface-border text-muted hover:bg-surface-mid"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Supplier Grid */}
      <div className="space-y-4 pb-12">
        <AnimatePresence mode="popLayout">
          {filteredFornecedores.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-surface rounded-[24px] border border-dashed border-surface-border"
            >
              <MapPin className="mx-auto text-dim mb-4" size={40} />
              <p className="text-muted font-bold">Nenhum fornecedor disponível</p>
              <p className="text-xs text-dim mt-1">
                {cidade ? `Na região de ${cidade}` : "Ajuste seus filtros ou busca"}
              </p>
            </motion.div>
          ) : (
            filteredFornecedores.map((f, i) => (
              <motion.div
                layout
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/estoque/fornecedor/${f.id}`}
                  className="block bg-surface rounded-[20px] overflow-hidden shadow-premium border border-surface-border active:scale-[0.98] transition-transform"
                >
                  {/* Banner */}
                  <div className="relative h-20 bg-gradient-to-br from-surface-mid to-surface-border">
                    {f.logo_url ? (
                      <img 
                        src={f.logo_url} 
                        alt={f.nome_fantasia} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={32} className="text-ember/20" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute inset-0 p-3 flex justify-between items-start">
                      {f.oferece_frete_full && (
                        <span className="bg-[#4ade80] text-[#052e16] text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Bike size={10} strokeWidth={3} /> Frete Full
                        </span>
                      )}
                      {f.aceita_cod && (
                        <span className="bg-[#fbbf24] text-[#78350f] text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm ml-auto">
                          COD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[15px] font-bold text-text truncate leading-tight">
                          {nomeFornecedor(f)}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-[11px] font-bold text-text">{f.avaliacao_media?.toFixed(1) || "5.0"}</span>
                          <span className="text-[11px] font-medium text-dim">({f.total_pedidos || 0})</span>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-surface-mid flex items-center justify-center text-dim">
                        <ChevronRight size={18} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider" style={{ background: "rgba(255,101,0,0.1)", color: "#ff6500" }}>
                        {TIPO_FORNECEDOR_LABEL[f.tipo] || "Farmácia"}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-wider">
                        📍 {f.endereco_cidade} e região ({f.raio_entrega_km || 50}km)
                      </span>
                    </div>

                    <div className="h-[1px] bg-surface-mid w-full" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-dim uppercase tracking-widest leading-none">A partir de</p>
                        <p className="text-[15px] font-black text-ember mt-1">
                          {f.preco_minimo ? formatBRL(f.preco_minimo) : "Consulte"}
                        </p>
                      </div>
                      <div className="bg-ember text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm shadow-ember/20">
                        <Clock size={12} strokeWidth={2.5} />
                        <span className="text-[11px] font-black">~{f.tempo_entrega_minutos || 60} min</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
