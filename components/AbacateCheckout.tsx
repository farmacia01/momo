'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export function AbacateCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/abacate/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Não foi possível iniciar o pagamento.')
        setLoading(false)
      }
    } catch {
      setError('Erro ao conectar com o servidor.')
      setLoading(false)
    }
  }

  if (error) {
    return <p className="py-4 text-center text-sm text-danger">{error}</p>
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-base font-black text-white transition-all active:scale-[0.97] disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))',
        boxShadow: 'var(--shadow-ember)',
      }}
    >
      {loading ? 'Redirecionando...' : 'Ativar meu acompanhamento'}
      {!loading && <ArrowRight size={18} />}
    </button>
  )
}
