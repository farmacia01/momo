type BadgeType = 'mood' | 'energy';

interface HealthBadgeProps {
  type: BadgeType;
  value: string;
}

export function HealthBadge({ type, value }: HealthBadgeProps) {
  const getColors = () => {
    if (type === 'mood') {
      switch (value.toLowerCase()) {
        case 'otimo': return 'bg-green-100 text-green-800';
        case 'bom': return 'bg-blue-100 text-blue-800';
        case 'regular': return 'bg-yellow-100 text-yellow-800';
        case 'ruim': return 'bg-red-100 text-red-800';
        default: return 'bg-surface-border text-gray-800';
      }
    } else {
      // energy
      switch (value.toLowerCase()) {
        case 'alta': return 'bg-green-100 text-green-800';
        case 'media': return 'bg-yellow-100 text-yellow-800';
        case 'baixa': return 'bg-red-100 text-red-800';
        default: return 'bg-surface-border text-gray-800';
      }
    }
  };

  const labels: Record<string, string> = {
    otimo: 'Ótimo',
    bom: 'Bom',
    regular: 'Regular',
    ruim: 'Ruim',
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getColors()}`}>
      {labels[value.toLowerCase()] || value}
    </span>
  );
}