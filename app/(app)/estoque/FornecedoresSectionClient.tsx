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
  estado 
}: { 
  fornecedores: any[], 
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
      <div className="relative -mx-6 px-6 pt-8 pb-12 bg-gradient-to-br from-[#1c4d2e] to-[#2d7a4f] rounded-b-[40px] shadow-lg">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60">Comprar ampolas</p>
          <h2 className="text-2xl font-black text-white">Fornecedores</h2>
          <p className="text-xs font-medium text-white/50">Entrega rápida via motoboy</p>
        </div>

        {/* Search Bar Overlay */}
        <div className="absolute left-6 right-6 -bottom-6">
          <div className="bg-white border border-slate-100 shadow-xl shadow-forest/10 rounded-2xl flex items-center gap-3 px-4 py-3.5 transition-all focus-within:ring-2 focus-within:ring-[#1c4d2e]/20">
            <Search size={18} className="text-slate-300" />
            <input 
              type="text"
              placeholder="Buscar farmácia ou produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
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
                ? "bg-[#1c4d2e] text-white shadow-md shadow-forest/20" 
                : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
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
              className="text-center py-16 bg-white rounded-[24px] border border-dashed border-slate-200"
            >
              <MapPin className="mx-auto text-slate-200 mb-4" size={40} />
              <p className="text-slate-500 font-bold">Nenhum fornecedor disponível</p>
              <p className="text-xs text-slate-400 mt-1">
                {estado ? `Na região de ${estado}` : "Ajuste seus filtros ou busca"}
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
                  className="block bg-white rounded-[20px] overflow-hidden shadow-premium border border-slate-50 active:scale-[0.98] transition-transform"
                >
                  {/* Banner */}
                  <div className="relative h-20 bg-gradient-to-br from-[#e8f5ee] to-[#cce8d9]">
                    {f.logo_url ? (
                      <img 
                        src={f.logo_url} 
                        alt={f.nome_fantasia} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={32} className="text-[#1c4d2e]/20" />
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
                        <h4 className="text-[15px] font-bold text-slate-900 truncate leading-tight">
                          {nomeFornecedor(f)}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-[11px] font-bold text-slate-900">{f.avaliacao_media?.toFixed(1) || "5.0"}</span>
                          <span className="text-[11px] font-medium text-slate-400">({f.total_pedidos || 0})</span>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <ChevronRight size={18} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-[#e8f5ee] text-[#1c4d2e] rounded-md text-[9px] font-black uppercase tracking-wider">
                        {TIPO_FORNECEDOR_LABEL[f.tipo] || "Farmácia"}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-wider">
                        🏍 Motoboy
                      </span>
                    </div>

                    <div className="h-[1px] bg-slate-50 w-full" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">A partir de</p>
                        <p className="text-[15px] font-black text-[#1c4d2e] mt-1">
                          {f.preco_minimo ? formatBRL(f.preco_minimo) : "Consulte"}
                        </p>
                      </div>
                      <div className="bg-[#16a34a] text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm shadow-[#16a34a]/20">
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
